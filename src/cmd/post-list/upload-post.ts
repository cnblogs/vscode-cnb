import { Uri, workspace, window, ProgressLocation, MessageOptions } from 'vscode'
import { Post } from '@/model/post'
import { LocalDraft } from '@/service/local-draft'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post'
import { PostFileMapManager } from '@/service/post-file-map'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { openPostInVscode } from './open-post-in-vscode'
import { openPostFile } from './open-post-file'
import { searchPostByTitle } from '@/service/search-post-by-title'
import * as path from 'path'
import { refreshPostList } from './refresh-post-list'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostCfgPanel } from '@/service/post-cfg-panel'
import { saveFilePendingChanges } from '@/infra/save-file-pending-changes'
import { extractImg } from '@/cmd/extract-img'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { MarkdownCfg } from '@/ctx/cfg/markdown'

const parseFileUri = async (fileUri: Uri | undefined): Promise<Uri | undefined> => {
    if (fileUri && fileUri.scheme !== 'file') {
        fileUri = undefined
    } else if (!fileUri) {
        const { activeTextEditor } = window
        if (activeTextEditor) {
            const { document } = activeTextEditor
            if (document.languageId === 'markdown' && !document.isUntitled) {
                await document.save()
                fileUri = document.uri
            }
        }
    }

    return fileUri
}

export const uploadPostFile = async (fileUri: Uri | undefined) => {
    fileUri = await parseFileUri(fileUri)
    if (!fileUri) return

    const { fsPath: filePath } = fileUri
    const postId = PostFileMapManager.getPostId(filePath)
    if (postId && postId >= 0) {
        await uploadPost(await PostService.fetchPostEditDto(postId))
    } else {
        const options = [`新建博文`, `关联已有博文`]
        const selected = await Alert.info(
            '本地文件尚未关联到博客园博文',
            {
                modal: true,
                detail: `您可以选择新建一篇博文或将本地文件关联到一篇博客园博文(您可以根据标题搜索您在博客园博文)`,
            } as MessageOptions,
            ...options
        )
        switch (selected) {
            case options[1]:
                {
                    const selectedPost = await searchPostByTitle({
                        postTitle: path.basename(filePath, path.extname(filePath)),
                        quickPickTitle: '搜索要关联的博文',
                    })
                    if (selectedPost) {
                        await PostFileMapManager.updateOrCreate(selectedPost.id, filePath)
                        const postEditDto = await PostService.fetchPostEditDto(selectedPost.id)
                        if (postEditDto) {
                            const fileContent = Buffer.from(await workspace.fs.readFile(fileUri)).toString()
                            if (!fileContent)
                                await workspace.fs.writeFile(fileUri, Buffer.from(postEditDto.post.postBody))

                            await uploadPost(postEditDto.post)
                        }
                    }
                }
                break
            case options[0]:
                await saveLocalDraftToCnblogs(new LocalDraft(filePath))
                break
        }
    }
}

export const saveLocalDraftToCnblogs = async (localDraft: LocalDraft) => {
    if (!localDraft) return

    // check format
    if (!['.md'].some(x => localDraft.fileExt === x)) {
        void Alert.warn('不受支持的文件格式! 只支持markdown格式')
        return
    }
    const editDto = await PostService.fetchPostEditTemplate()
    if (!editDto) return

    const { post } = editDto
    post.title = localDraft.fileNameWithoutExt
    post.isMarkdown = true
    post.categoryIds ??= []
    void PostCfgPanel.open({
        panelTitle: '',
        localFileUri: localDraft.filePathUri,
        breadcrumbs: ['新建博文', '博文设置', post.title],
        post,
        successCallback: async savedPost => {
            await refreshPostList()
            await openPostFile(localDraft)

            await PostFileMapManager.updateOrCreate(savedPost.id, localDraft.filePath)
            await openPostFile(localDraft)
            postDataProvider.fireTreeDataChangedEvent(undefined)
            void Alert.info('博文已创建')
        },
        beforeUpdate: async (postToSave, panel) => {
            await saveFilePendingChanges(localDraft.filePath)
            // 本地文件已经被删除了
            if (!localDraft.exist && panel) {
                void Alert.warn('本地文件已删除, 无法新建博文')
                return false
            }
            const autoExtractImgSrc = MarkdownCfg.getAutoExtractImgSrc()
            if (autoExtractImgSrc !== undefined)
                await extractImg(localDraft.filePathUri, autoExtractImgSrc).catch(console.warn)

            postToSave.postBody = await localDraft.readAllText()
            return true
        },
    })
}

export const uploadPost = async (input: Post | PostTreeItem | PostEditDto | undefined) => {
    input = input instanceof PostTreeItem ? input.post : input
    const post =
        input instanceof PostEditDto
            ? input.post
            : input
            ? (await PostService.fetchPostEditDto(input.id))?.post
            : undefined
    if (!post) return

    const { id: postId } = post
    const localFilePath = PostFileMapManager.getFilePath(postId)
    if (!localFilePath) return Alert.warn('本地无该博文的编辑记录')

    const autoExtractImgSrc = MarkdownCfg.getAutoExtractImgSrc()
    if (autoExtractImgSrc !== undefined)
        await extractImg(Uri.file(localFilePath), autoExtractImgSrc).catch(console.warn)

    await saveFilePendingChanges(localFilePath)
    post.postBody = (await workspace.fs.readFile(Uri.file(localFilePath))).toString()
    post.isMarkdown = path.extname(localFilePath).endsWith('md') || post.isMarkdown

    if (!validatePost(post)) return false

    if (MarkdownCfg.isShowConfirmMsgWhenUploadPost()) {
        const answer = await Alert.warn(
            '确认上传博文吗?',
            {
                modal: true,
                detail: '本地博文将保存至服务端(该对话框可在设置中关闭)',
            },
            '确认'
        )
        if (answer !== '确认') return false
    }

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
            let hasSaved = false
            try {
                const { id: postId } = await PostService.updatePost(post)
                await openPostInVscode(postId)
                post.id = postId

                hasSaved = true
                progress.report({ increment: 100 })
                void Alert.info('上传成功')
                await refreshPostList()
            } catch (err) {
                progress.report({ increment: 100 })
                void Alert.err(`上传失败\n${err instanceof Error ? err.message : JSON.stringify(err)}`)
                console.error(err)
            }
            return hasSaved
        }
    )
}

const validatePost = (post: Post): boolean => {
    if (!post.postBody) {
        void Alert.warn('文件内容为空!')
        return false
    }

    return true
}
