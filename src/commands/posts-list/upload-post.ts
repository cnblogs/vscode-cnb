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
import { postConfigurationPanel } from '@/services/post-configuration-panel.service'
import { saveFilePendingChanges } from '@/utils/save-file-pending-changes'
import { extractImages } from '../extract-images'
import { Settings } from '@/services/settings.service'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'

async function parseFileUri(fileUri: Uri | undefined) {
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

export const uploadPostFileToCnblogs = async (fileUri: Uri | undefined) => {
    const parsedFileUri = await parseFileUri(fileUri)
    if (parsedFileUri === undefined) return

    const { fsPath: filePath } = parsedFileUri
    const postId = PostFileMapManager.getPostId(filePath)

    if (postId !== undefined && postId >= 0) {
        const dto = await PostService.fetchPostEditDto(postId)
        if (dto !== undefined) await uploadPostToCnblogs(dto)
        return
    }

    const fileContent = Buffer.from(await workspace.fs.readFile(parsedFileUri)).toString()
    if (isEmptyBody(fileContent)) return

    const options = ['新建博文', '关联已有博文']
    const selected = await window.showInformationMessage(
        '本地文件尚未关联到博客园博文',
        {
            modal: true,
            detail: `您可以选择新建一篇博文或将本地文件关联到一篇博客园博文(您可以根据标题搜索您在博客园博文)`,
        } as MessageOptions,
        ...options
    )
    if (selected === '关联已有博文') {
        const selectedPost = await searchPostsByTitle({
            postTitle: path.basename(filePath, path.extname(filePath)),
            quickPickTitle: '搜索要关联的博文',
        })
        if (selectedPost === undefined) return

        await PostFileMapManager.updateOrCreate(selectedPost.id, filePath)
        const postEditDto = await PostService.fetchPostEditDto(selectedPost.id)
        if (postEditDto === undefined) return
        if (!fileContent) await workspace.fs.writeFile(parsedFileUri, Buffer.from(postEditDto.post.postBody))

        await uploadPostToCnblogs(postEditDto.post)
    } else if (selected === '新建博文') {
        await saveLocalDraftToCnblogs(new LocalDraft(filePath))
    }
}

export async function saveLocalDraftToCnblogs(localDraft: LocalDraft) {
    // check format
    if (!['.md', '.mkd'].some(x => localDraft.fileExt === x)) {
        AlertService.warn('格式错误, 只支持 Markdown 文件')
        return
    }
    const editDto = await PostService.fetchPostEditTemplate()
    if (!editDto) return

    const { post } = editDto

    post.title = localDraft.fileNameWithoutExt
    post.isMarkdown = true
    post.categoryIds ??= []
    void postConfigurationPanel.open({
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
    if (input === undefined) return
    if (input instanceof PostTreeItem) input = input.post

    let post: Post | undefined

    if (input instanceof PostEditDto) post = input.post
    else (await PostService.fetchPostEditDto(input.id))?.post

    if (post === undefined) return

    const localFilePath = PostFileMapManager.getFilePath(post.id)
    if (!localFilePath) return AlertService.warn('本地无该博文的编辑记录')

    if (Settings.automaticallyExtractImagesType)
        await extractImages(Uri.file(localFilePath), Settings.automaticallyExtractImagesType).catch(console.warn)

    await saveFilePendingChanges(localFilePath)
    post.postBody = (await workspace.fs.readFile(Uri.file(localFilePath))).toString()

    if (isEmptyBody(post.postBody)) return false

    post.isMarkdown =
        path.extname(localFilePath).endsWith('md') || path.extname(localFilePath).endsWith('mkd') || post.isMarkdown

    if (Settings.showConfirmMsgWhenUploadPost) {
        const answer = await vscode.window.showWarningMessage(
            '确认上传博文吗?',
            {
                modal: true,
                detail: '本地博文将保存至服务端(可通过设置关闭对话框)',
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
                const { id: postId } = await PostService.updatePost(thePost)
                await openPostInVscode(postId)
                thePost.id = postId

                isSaved = true
                progress.report({ increment: 100 })
                AlertService.info('上传成功')
                await refreshPostsList()
            } catch (err) {
                progress.report({ increment: 100 })
                AlertService.err(`上传失败\n${err instanceof Error ? err.message : JSON.stringify(err)}`)
                console.error(err)
            }

            return isSaved
        }
    )
}

function isEmptyBody(body: string) {
    if (body === '') {
        AlertService.warn('博文内容不能为空')
        return true
    }

    return false
}
