import { Uri, window, workspace } from 'vscode'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { PostService } from '@/service/post/post'
import { Alert } from '@/infra/alert'
import path from 'path'
import { revealPostListItem } from '@/service/post/post-list-view'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { fsUtil } from '@/infra/fs/fsUtil'
import { searchPostByTitle } from '@/service/post/search-post-by-title'

type InputType = Post | PostTreeItem | Uri | number | undefined | null

async function getPostId(input: InputType): Promise<number | undefined | null> {
    if (typeof input === 'number') return input
    if (input instanceof Post && input.id > 0) return input.id
    if (input instanceof PostTreeItem && input.post.id > 0) return input.post.id
    if (input instanceof Uri) {
        const postId = await getPostIdFromUri(input)
        return postId
    }

    const doc = window.activeTextEditor?.document
    if (doc != null && !doc.isUntitled) {
        const postId = await getPostIdFromUri(doc.uri)
        return postId
    }
}

export async function postPull(input: InputType, showConfirm = true, mute = false): Promise<boolean> {
    let isFreshPull = false
    let post: Post | null = null

    const postId = await getPostId(input)
    if (postId == null) {
        void Alert.err(`无效的额 postId，值为 ${postId}`)
        return false
    }

    post = (await PostService.getPostEditDto(postId))?.post
    if (post == null) {
        void Alert.err(`对应的博文不存在，postId: ${postId}`)
        return false
    }

    let uriPath = PostFileMapManager.getFilePath(post.id)
    let fileUri: Uri
    if (uriPath == null) {
        fileUri = PostFileMapManager.buildLocalPostFileUri(post)
    } else {
        // replace fsPath with uriPath
        if (!uriPath.startsWith('/')) uriPath = Uri.file(uriPath).path
        if (!PostFileMapManager.isInWorkspace(uriPath)) fileUri = PostFileMapManager.buildLocalPostFileUri(post)
        else fileUri = Uri.parse(uriPath)
    }

    uriPath = fileUri.path
    const fsPath = fileUri.fsPath
    const fileName = path.basename(fsPath)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const fileExists = await fsUtil.exists(fsPath)

    if (fileExists) {
        if (showConfirm && !isFreshPull && MarkdownCfg.isShowConfirmMsgWhenPullPost()) {
            const answer = await Alert.warn(
                '确认要拉取远程博文吗?',
                {
                    modal: true,
                    detail: `本地文件「${fileName}」将被覆盖(可通过设置关闭对话框)`,
                },
                '确认'
            )
            if (answer !== '确认') return false
        }
    } else {
        isFreshPull = true
    }

    await workspace.fs.writeFile(fileUri, Buffer.from(post.postBody))
    await PostFileMapManager.updateOrCreate(post.id, uriPath)
    await revealPostListItem(post)

    if (!mute) {
        if (isFreshPull) await Alert.info(`博文已下载至本地：${fileName}`)
        else await Alert.info(`本地文件已更新: ${fileName}`)
    }

    return true
}

async function getPostIdFromUri(fileUri: Uri): Promise<number | undefined> {
    let postId = PostFileMapManager.getPostId(fileUri.path)
    if (postId == null) {
        const mapPost = '关联已有博文并拉取'
        const selected = await Alert.info(
            '本地文件尚未关联到博客园博文',
            {
                modal: true,
                detail: `您可以将当前本地文件关联到已有博客园博文`,
            },
            mapPost
        )

        if (selected === mapPost) {
            const fsPath = fileUri.fsPath
            const filenName = path.basename(fsPath, path.extname(fsPath))
            postId = PostFileMapManager.extractPostId(filenName)
            if (postId == null) {
                const selectedPost = await searchPostByTitle(filenName, '搜索要关联的博文')
                if (selectedPost == null) {
                    void Alert.info('未选择要关联的博文')
                    return
                }
                postId = selectedPost.id
            }
        }

        if (postId != null) await PostFileMapManager.updateOrCreate(postId, fileUri.path)
    }

    if (postId == null) Alert.fileNotLinkedToPost(fileUri)

    return postId
}
