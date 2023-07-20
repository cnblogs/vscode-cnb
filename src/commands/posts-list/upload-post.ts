import vscode, { Uri, workspace, window, ProgressLocation, MessageOptions } from 'vscode'
import { Post } from '@/models/post'
import { LocalDraft } from '@/services/local-draft.service'
import { AlertService } from '@/services/alert.service'
import { PostService } from '@/services/post.service'
import { PostFileMapManager } from '@/services/post-file-map'
import { postsDataProvider } from '@/tree-view-providers/posts-data-provider'
import { openPostInVscode } from './open-post-in-vscode'
import { openPostFile } from './open-post-file'
import { searchPostsByTitle } from '@/services/search-post-by-title'
import * as path from 'path'
import { refreshPostsList } from './refresh-posts-list'
import { PostEditDto } from '@/models/post-edit-dto'
import { PostCfgPanel } from '@/services/post-cfg-panel.service'
import { saveFilePendingChanges } from '@/utils/save-file-pending-changes'
import { extractImages } from '../extract-images'
import { Settings } from '@/services/settings.service'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'

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

export const uploadPostFileToCnblogs = async (fileUri: Uri | undefined) => {
    fileUri = await parseFileUri(fileUri)
    if (!fileUri) return

    const { fsPath: filePath } = fileUri
    const postId = PostFileMapManager.getPostId(filePath)
    if (postId && postId >= 0) {
        await uploadPostToCnblogs(await PostService.fetchPostEditDto(postId))
    } else {
        const options = [`新建博文`, `关联已有博文`]
        const selected = await AlertService.info(
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
                    const selectedPost = await searchPostsByTitle({
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

                            await uploadPostToCnblogs(postEditDto.post)
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
        AlertService.warn('不受支持的文件格式! 只支持markdown格式')
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
            await refreshPostsList()
            await openPostFile(localDraft)

            await PostFileMapManager.updateOrCreate(savedPost.id, localDraft.filePath)
            await openPostFile(localDraft)
            postsDataProvider.fireTreeDataChangedEvent(undefined)
            AlertService.info('博文已创建')
        },
        beforeUpdate: async (postToSave, panel) => {
            await saveFilePendingChanges(localDraft.filePath)
            // 本地文件已经被删除了
            if (!localDraft.exist && panel) {
                AlertService.warn('本地文件已删除, 无法新建博文')
                return false
            }
            if (Settings.automaticallyExtractImagesType)
                await extractImages(localDraft.filePathUri, Settings.automaticallyExtractImagesType).catch(console.warn)

            postToSave.postBody = await localDraft.readAllText()
            return true
        },
    })
}

export const uploadPostToCnblogs = async (input: Post | PostTreeItem | PostEditDto | undefined) => {
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
    if (!localFilePath) return AlertService.warn('本地无该博文的编辑记录')

    if (Settings.automaticallyExtractImagesType)
        await extractImages(Uri.file(localFilePath), Settings.automaticallyExtractImagesType).catch(console.warn)

    await saveFilePendingChanges(localFilePath)
    post.postBody = (await workspace.fs.readFile(Uri.file(localFilePath))).toString()
    post.isMarkdown = path.extname(localFilePath).endsWith('md') || post.isMarkdown

    if (!validatePost(post)) return false

    if (Settings.showConfirmMsgWhenUploadPost) {
        const answer = await AlertService.warn(
            '确认上传吗?',
            {
                modal: true,
                detail: '本地博文将对远程博文进行覆盖, 操作不可逆!(此消息可在设置中关闭)',
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
                AlertService.info('上传成功')
                await refreshPostsList()
            } catch (err) {
                progress.report({ increment: 100 })
                AlertService.err(`上传失败\n${err instanceof Error ? err.message : JSON.stringify(err)}`)
                console.error(err)
            }
            return hasSaved
        }
    )
}

const validatePost = (post: Post): boolean => {
    if (!post.postBody) {
        AlertService.warn('文件内容为空!')
        return false
    }

    return true
}
