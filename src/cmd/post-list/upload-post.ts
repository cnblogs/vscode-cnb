import { Uri, workspace, window, ProgressLocation } from 'vscode'
import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { openPostInVscode } from './open-post-in-vscode'
import { openPostFile } from './open-post-file'
import { searchPostByTitle } from '@/service/post/search-post-by-title'
import * as path from 'path'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostCfgPanel } from '@/service/post/post-cfg-panel'
import { saveFilePendingChanges } from '@/infra/save-file-pending-changes'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { PostListView } from '@/cmd/post-list/post-list-view'
import { LocalPost } from '@/service/local-post'
import { extractImg } from '@/service/extract-img/extract-img'
import { dirname } from 'path'
import { Workspace } from '@/cmd/workspace'
import { fsUtil } from '@/infra/fs/fsUtil'

async function parseFileUri(fileUri?: Uri) {
    if (fileUri !== undefined && fileUri.scheme !== 'file') return undefined
    if (fileUri !== undefined) return fileUri

    const { activeTextEditor } = window
    if (activeTextEditor === undefined) return undefined

    const { document } = activeTextEditor
    if (document.languageId === 'markdown' && !document.isUntitled) {
        await document.save()
        return document.uri
    }

    return undefined
}

export async function saveLocalPost(localPost: LocalPost) {
    // check format
    if (!['.md', '.mkd', '.htm', '.html'].some(x => localPost.fileExt === x)) {
        void Alert.warn('格式错误, 只支持 Markdown 或者 html 文件')
        return
    }
    const { post } = await PostService.getTemplate()

    post.title = localPost.fileNameWithoutExt
    post.isMarkdown = true
    post.categoryIds = []
    void PostCfgPanel.open({
        panelTitle: post.title,
        localFileUri: Uri.file(localPost.filePath),
        breadcrumbs: ['新建博文', '博文设置', post.title],
        post,
        afterSuccess: async savedPost => {
            await PostListView.refresh()
            await openPostFile(localPost)

            await PostFileMapManager.updateOrCreate(savedPost.id, localPost.filePath)
            await openPostFile(localPost)
            postDataProvider.fireTreeDataChangedEvent()
            void Alert.info('博文已创建')
        },
        beforeUpdate: async postToSave => {
            await saveFilePendingChanges(localPost.filePath)

            if (!(await fsUtil.exists(localPost.filePath))) {
                void Alert.warn('本地文件已删除, 无法新建博文')
                return false
            }
            const text = await localPost.readAllText()
            if (isEmptyBody(text)) return false

            // TODO: need refactor
            const autoExtractImgSrc = MarkdownCfg.getAutoExtractImgSrc()
            const fileDir = dirname(localPost.filePath)
            postToSave.postBody = text
            if (autoExtractImgSrc !== undefined) {
                const extracted = await extractImg(text, fileDir, autoExtractImgSrc)
                if (extracted !== undefined) {
                    postToSave.postBody = extracted
                    if (isEmptyBody(postToSave.postBody, '（发生于提取图片后')) return false

                    if (MarkdownCfg.getApplyAutoExtractImgToLocal()) {
                        const doc = window.visibleTextEditors.find(x => x.document.uri.fsPath === localPost.filePath)
                            ?.document
                        if (doc !== undefined) {
                            const we = Workspace.resetTextDoc(doc, extracted)
                            await workspace.applyEdit(we)
                        }
                    }
                }
            }

            return true
        },
    })
}

function isEmptyBody(body: string, tip: string = '') {
    if (body === '') {
        void Alert.warn('博文内容不能为空' + tip)
        return true
    }

    return false
}

export async function uploadPost(input?: Post | PostTreeItem | PostEditDto, confirm = true) {
    if (input === undefined) return
    if (input instanceof PostTreeItem) input = input.post

    let post: Post | undefined

    if (input instanceof Post) {
        const dto = await PostService.getPostEditDto(input.id)
        post = dto?.post
    } else {
        post = input.post
    }

    if (post === undefined) return

    const localFilePath = PostFileMapManager.getFilePath(post.id)
    if (localFilePath === undefined) return Alert.warn('本地无该博文的编辑记录')

    await saveFilePendingChanges(localFilePath)

    const localPost = new LocalPost(localFilePath)

    // TODO: need refactor
    const text = await localPost.readAllText()
    const autoExtractImgSrc = MarkdownCfg.getAutoExtractImgSrc()
    const fileDir = dirname(localPost.filePath)
    post.postBody = text
    if (autoExtractImgSrc !== undefined) {
        const extracted = await extractImg(text, fileDir, autoExtractImgSrc)
        if (extracted !== undefined) {
            post.postBody = extracted
            if (isEmptyBody(post.postBody, '（发生于提取图片后')) return false

            if (MarkdownCfg.getApplyAutoExtractImgToLocal()) {
                const doc = window.visibleTextEditors.find(x => x.document.uri.fsPath === localPost.filePath)?.document
                if (doc !== undefined) {
                    const we = Workspace.resetTextDoc(doc, extracted)
                    await workspace.applyEdit(we)
                }
            }
        }
    }

    if (isEmptyBody(post.postBody)) return false

    post.isMarkdown =
        path.extname(localFilePath).endsWith('md') || path.extname(localFilePath).endsWith('mkd') || post.isMarkdown

    if (MarkdownCfg.isShowConfirmMsgWhenUploadPost() && confirm) {
        const answer = await Alert.info(
            '确认上传这篇博文吗?',
            {
                modal: true,
                detail: '本地博文将保存至服务端(可通过设置关闭此对话框)',
            },
            '确认'
        )
        if (answer !== '确认') return false
    }

    const thePost = post // Dup code for type checking

    return window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: '正在上传博文',
            cancellable: false,
        },
        async progress => {
            progress.report({
                increment: 10,
            })

            let isSaved = false

            try {
                const { id: postId } = await PostService.update(thePost)
                await openPostInVscode(postId)
                thePost.id = postId

                isSaved = true
                progress.report({ increment: 100 })
                void Alert.info('上传成功')
                await PostListView.refresh()
            } catch (e) {
                progress.report({ increment: 100 })
                void Alert.err(`上传失败: ${<string>e}`)
            }

            return isSaved
        }
    )
}

export async function uploadPostFile(fileUri?: Uri, confirm = true) {
    const parsedFileUri = await parseFileUri(fileUri)
    if (parsedFileUri === undefined) return

    const { fsPath: filePath } = parsedFileUri
    const postId = PostFileMapManager.getPostId(filePath)

    if (postId !== undefined && postId >= 0) {
        const dto = await PostService.getPostEditDto(postId)
        if (dto !== undefined) await uploadPost(dto, confirm)
        return
    }

    const fileContent = Buffer.from(await workspace.fs.readFile(parsedFileUri)).toString()
    if (isEmptyBody(fileContent)) return

    const selected = await Alert.info(
        '本地文件尚未关联到博客园博文',
        {
            modal: true,
            detail: `您可以选择新建一篇博文或将本地文件关联到一篇博客园博文(您可以根据标题搜索您在博客园博文)`,
        },
        '新建博文',
        '关联已有博文'
    )
    if (selected === '关联已有博文') {
        const selectedPost = await searchPostByTitle(
            path.basename(filePath, path.extname(filePath)),
            '搜索要关联的博文'
        )
        if (selectedPost === undefined) return

        await PostFileMapManager.updateOrCreate(selectedPost.id, filePath)
        const postEditDto = await PostService.getPostEditDto(selectedPost.id)
        if (postEditDto === undefined) return
        if (fileContent === '') await workspace.fs.writeFile(parsedFileUri, Buffer.from(postEditDto.post.postBody))

        await uploadPost(postEditDto.post, confirm)
    } else if (selected === '新建博文') {
        await saveLocalPost(new LocalPost(filePath))
    }
}
