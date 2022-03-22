import puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Progress, ProgressLocation, Uri, window, workspace } from 'vscode';
import { Post } from '../../models/post';
import { PostFileMapManager } from '../../services/post-file-map';
import { postService } from '../../services/post.service';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';
import { postPdfTemplateBuilder } from './post-pdf-template-builder';
import { chromiumPathProvider } from '../../utils/chromium-path-provider';
import { Settings } from '../../services/settings.service';

const launchBrowser = async (chromiumPath: string) => {
    const browser = await puppeteer.launch({
        dumpio: true,
        headless: true,
        devtools: false,
        executablePath: chromiumPath,
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ referer: 'https://www.cnblogs.com/' });
    await page.setCacheEnabled(false);
    return { browser, page };
};

const exportOne = async (
    idx: number,
    total: number,
    post: Post,
    page: puppeteer.Page,
    targetFileUri: Uri,
    progress: Progress<any>
) => {
    let message = `[${idx + 1}/${total}]正在导出 - ${post.title}`;
    const report = (increment: number) => {
        progress.report({
            increment: increment,
            message,
        });
    };
    report(10);
    let html = await postPdfTemplateBuilder.build(post);
    report(15);
    // Wait for code block highlight finished
    await Promise.all([
        new Promise<void>(resolve => {
            page.on('console', ev => {
                if (ev.text() === postPdfTemplateBuilder.highlightedMessage) {
                    resolve();
                }
            });
        }),
        page.setContent(html, {
            timeout: 15 * 1000,
        }),
    ]);
    report(40);
    let pdfBuffer = await createPdfBuffer(page);
    report(90);
    await writePdfToFile(targetFileUri!, post, pdfBuffer);
};

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
    });

const writePdfToFile = (dir: Uri, post: Post, buffer: Buffer) =>
    new Promise<void>(resolve => {
        fs.writeFile(path.join(dir!.fsPath, `${post.title}.pdf`), buffer, () => {
            resolve();
        });
    });

const retrieveChromiumPath = async (): Promise<string | undefined> => {
    let path: string | undefined = Settings.chromiumPath;
    if (fs.existsSync(path)) {
        return path;
    }

    const platform = os.platform();
    const { defaultChromiumPath } = chromiumPathProvider;
    if (platform === 'darwin') {
        // mac
        path = defaultChromiumPath.osx.find(x => fs.existsSync(x)) ?? '';
    } else if (platform === 'win32') {
        // windows
        path = defaultChromiumPath.win.find(x => fs.existsSync(x)) ?? '';
    }

    if (path) {
        return path;
    }
    const { options } = chromiumPathProvider;
    const input = await window.showWarningMessage(
        '未找到Chromium可执行文件',
        {
            modal: true,
        },
        ...options.map(x => x[0])
    );
    const op = options.find(x => x[0] === input);
    path = op ? await op[1]() : undefined;
    if (path && path !== Settings.chromiumPath) {
        Settings.setChromiumPath(path);
    }
    return path;
};

const inputTargetFolder = async (): Promise<Uri | undefined> => {
    return ((await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: '请选择用于保存pdf的目录',
    })) ?? [])[0];
};

const handlePostInput = (post: Post): Promise<Post[]> => {
    const posts: Post[] = [post];
    posts.push(post);
    extensionViews.postsList?.selection.map(post => {
        if (post instanceof Post && !posts.includes(post)) {
            posts.push(post);
        }
    });
    return Promise.resolve(posts);
};

const handleUriInput = async (uri: Uri): Promise<Post[]> => {
    const posts: Post[] = [];
    const postId = PostFileMapManager.getPostId(uri.fsPath);
    let inputPost: Post;
    if (postId && postId > 0) {
        inputPost = (await postService.fetchPostEditDto(postId)).post;
    } else {
        const { fsPath } = uri;
        inputPost = Object.assign((await postService.fetchPostEditDto(-1)).post, {
            id: -1,
            title: path.basename(fsPath, path.extname(fsPath)),
            postBody: new TextDecoder().decode(await workspace.fs.readFile(uri)),
        } as Post);
    }

    posts.push(inputPost);

    return posts;
};

const exportPostToPdf = async (input: Post | Uri): Promise<void> => {
    await window.withProgress(
        {
            title: `正在导出`,
            location: ProgressLocation.Notification,
        },
        async progress => {
            let selectedPosts = await (input instanceof Post ? handlePostInput(input) : handleUriInput(input));
            if (selectedPosts.length <= 0) {
                return;
            }
            if (input instanceof Post) {
                selectedPosts = (await Promise.all(selectedPosts.map(p => postService.fetchPostEditDto(p.id)))).map(
                    x => x.post
                );
            }
            const chromiumPath = await retrieveChromiumPath();
            let dir = await inputTargetFolder();
            if (!dir || !chromiumPath) {
                return;
            }

            const { browser, page } = await launchBrowser(chromiumPath);
            let idx = 0;
            const { length: total } = selectedPosts;
            for (const post of selectedPosts) {
                try {
                    await exportOne(idx++, total, post, page, dir!, progress);
                } catch {
                    continue;
                }
            }
            await page.close();
            await browser.close();
        }
    );
};

export { exportPostToPdf };
