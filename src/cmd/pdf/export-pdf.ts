import type puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { MessageOptions, Progress, ProgressLocation, Uri, window, workspace } from 'vscode'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post-file-map'
import { PostService } from '@/service/post'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { ChromiumPathProvider } from '@/infra/chromium-path-provider'
import { Settings } from '@/service/settings'
import { accountManager } from '@/auth/account-manager'
import { Alert } from '@/service/alert'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { PostEditDto } from '@/model/post-edit-dto'
import { postPdfTemplateBuilder } from '@/cmd/pdf/post-pdf-template-builder'

const launchBrowser = async (
    chromiumPath: string
): Promise<
    | {
          browser: puppeteer.Browser
          page: puppeteer.Page
      }
    | undefined
> => {
    try {
        const puppeteer = (await import('puppeteer-core')).default
        const browser = await puppeteer.launch({
            dumpio: true,
            headless: true,
            devtools: false,
            executablePath: chromiumPath,
        })
        const page = await browser.newPage()
        await page.setExtraHTTPHeaders({ referer: 'https://www.cnblogs.com/' })
        await page.setCacheEnabled(false)
        return { browser, page }
    } catch {
        return undefined
    }
}

const exportOne = async (
    idx: number,
    total: number,
    post: Post,
    page: puppeteer.Page,
    targetFileUri: Uri,
    progress: Progress<{ message: string; increment: number }>,
    blogApp: string
) => {
    const message = `[${idx + 1}/${total}]正在导出 - ${post.title}`
    const report = (increment: number) => {
        progress.report({
            increment: increment,
            message,
        })
    }
    report(10)
    const html = await postPdfTemplateBuilder.build(post, blogApp)
    report(15)
    // Wait for code block highlight finished
    await Promise.all([
        new Promise<void>(resolve => {
            page.on('console', ev => {
                if (ev.text() === postPdfTemplateBuilder.HighlightedMessage) resolve()
            })
        }),
        page.setContent(html, {
            timeout: 15 * 1000,
        }),
    ])
    report(40)
    const pdfBuffer = await createPdfBuffer(page)
    report(90)
    await writePdfToFile(targetFileUri, post, pdfBuffer)
    report(-100)
}

const createPdfBuffer = (page: puppeteer.Page) =>
    page.pdf({
        format: 'a4',
        printBackground: true,
        margin: {
            top: '1cm',
            bottom: '1cm',
            left: '0.2cm',
            right: '0.2cm',
        },
    })

const writePdfToFile = (dir: Uri, post: Post, buffer: Buffer) =>
    new Promise<void>(resolve => {
        fs.writeFile(path.join(dir.fsPath, `${post.title}.pdf`), buffer, () => {
            resolve()
        })
    })

const retrieveChromiumPath = async (): Promise<string | undefined> => {
    let path: string | undefined = ChromiumPathProvider.lookupExecutableFromMacApp(Settings.chromiumPath)
    if (path && fs.existsSync(path)) return path

    const platform = os.platform()
    const { defaultChromiumPath } = ChromiumPathProvider
    if (platform === 'darwin') {
        // mac
        path = defaultChromiumPath.osx.find(x => fs.existsSync(x)) ?? ''
        path = ChromiumPathProvider.lookupExecutableFromMacApp(path)
    } else if (platform === 'win32') {
        // windows
        path = defaultChromiumPath.win.find(x => fs.existsSync(x)) ?? ''
    }

    if (!path) {
        const { Options: options } = ChromiumPathProvider
        const input = await Alert.warn(
            '未找到Chromium可执行文件',
            {
                modal: true,
            },
            ...options.map(x => x[0])
        )
        const op = options.find(x => x[0] === input)
        path = op ? await op[1]() : undefined
    }

    if (path !== undefined && path !== Settings.chromiumPath) await Settings.setChromiumPath(path)

    return path
}

const inputTargetFolder = async (): Promise<Uri | undefined> =>
    ((await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: '请选择用于保存 PDF 的目录',
    })) ?? [])[0]

const handlePostInput = (post: Post | PostTreeItem): Promise<Post[]> => {
    const postList: Post[] = [post instanceof PostTreeItem ? post.post : post]
    extTreeViews.visiblePostList()?.selection.map(item => {
        item = item instanceof PostTreeItem ? item.post : item
        if (item instanceof Post && !postList.includes(item)) postList.push(item)
    })
    return Promise.resolve(postList)
}

const handleUriInput = async (uri: Uri): Promise<Post[]> => {
    const postList: Post[] = []
    const { fsPath } = uri
    const postId = PostFileMapManager.getPostId(fsPath)
    const { post: inputPost } = (await PostService.fetchPostEditDto(postId && postId > 0 ? postId : -1)) ?? {}

    if (!inputPost) {
        return []
    } else if (inputPost.id <= 0) {
        Object.assign(inputPost, {
            id: -1,
            title: path.basename(fsPath, path.extname(fsPath)),
            postBody: Buffer.from(await workspace.fs.readFile(uri)).toString(),
        } as Post)
    }

    postList.push(inputPost)

    return postList
}

const mapToPostEditDto = async (postList: Post[]) =>
    (await Promise.all(postList.map(p => PostService.fetchPostEditDto(p.id))))
        .filter((x): x is PostEditDto => x != null)
        .map(x => x?.post)

const reportErrors = (errors: string[] | undefined) => {
    if (errors && errors.length > 0) {
        void Alert.err('导出 PDF 时遇到错误', {
            modal: true,
            detail: errors.join('\n'),
        } as MessageOptions)
    }
}

const exportPostToPdf = async (input: Post | PostTreeItem | Uri | unknown): Promise<void> => {
    if (!(input instanceof Post) && !(input instanceof PostTreeItem) && !(input instanceof Uri)) return

    const chromiumPath = await retrieveChromiumPath()
    if (!chromiumPath) return

    const {
        currentUser: { blogApp },
    } = accountManager

    if (!blogApp) return void Alert.warn('无法获取到博客地址, 请检查登录状态')

    reportErrors(
        await window.withProgress<string[] | undefined>(
            {
                location: ProgressLocation.Notification,
            },
            async progress => {
                const errors: string[] = []
                progress.report({ message: '导出 PDF - 处理博文数据' })
                let selectedPost = await (input instanceof Post || input instanceof PostTreeItem
                    ? handlePostInput(input)
                    : handleUriInput(input))
                if (selectedPost.length <= 0) return

                selectedPost = input instanceof Post ? await mapToPostEditDto(selectedPost) : selectedPost
                progress.report({ message: '选择输出文件夹' })
                const dir = await inputTargetFolder()
                if (!dir || !chromiumPath) return

                progress.report({ message: '启动 Chromium' })
                const { browser, page } = (await launchBrowser(chromiumPath)) ?? {}
                if (!browser || !page) return ['启动 Chromium 失败']

                let idx = 0
                const { length: total } = selectedPost
                for (const post of selectedPost) {
                    try {
                        await exportOne(idx++, total, post, page, dir, progress, blogApp)
                    } catch (err) {
                        errors.push(`导出"${post.title}失败", ${JSON.stringify(err)}`)
                    }
                }
                await page.close()
                await browser.close()
                return errors
            }
        )
    )
}

export { exportPostToPdf }
