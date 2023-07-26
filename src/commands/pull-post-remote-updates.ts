import { MessageOptions, Uri, window, workspace } from 'vscode'
import { Post } from '@/models/post'
import { PostFileMapManager } from '@/services/post-file-map'
import { openPostInVscode } from './posts-list/open-post-in-vscode'
import fs from 'fs'
import { PostService } from '@/services/post.service'
import { AlertService } from '@/services/alert.service'
import path from 'path'
import { revealPostsListItem } from '@/services/posts-list-view'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'
import { Settings } from '@/services/settings.service'

const pullPostRemoteUpdates = async (input: Post | PostTreeItem | Uri | undefined | null): Promise<void> => {
    const ctxs: CommandContext[] = []
    let uri: Uri | undefined
    input = input instanceof PostTreeItem ? input.post : input
    if (parsePostInput(input) && input.id > 0) await handlePostInput(input, ctxs)
    else if ((uri = parseUriInput(input))) await handleUriInput(uri, ctxs)

    if (Settings.showConfirmMsgWhenPullPost) {
        const answer = await window.showWarningMessage(
            '确认要拉取远程博文吗?',
            {
                modal: true,
                detail: `本地文件 ${resolveFileNames(ctxs)} 将被覆盖(可通过设置关闭对话框)`,
            } as MessageOptions,
            '确认'
        )
        if (answer !== '确认') return
    }

    if (ctxs.length <= 0) return

    await update(ctxs)

    AlertService.info(`本地文件${resolveFileNames(ctxs)}已更新`)
}

export { pullPostRemoteUpdates }

type InputType = Post | Uri | undefined | null
type CommandContext = { postId: number; fileUri: Uri }

const parsePostInput = (input: InputType): input is Post => input instanceof Post

const handlePostInput = async (post: Post, contexts: CommandContext[]) => {
    const { id: postId } = post
    let filePath = PostFileMapManager.getFilePath(postId)
    if (filePath && !fs.existsSync(filePath)) {
        // 博文关联了本地不存在文件, 此时需要删除这个关联

        filePath = ''
        await PostFileMapManager.updateOrCreate(postId, filePath)
    }
    if (!filePath) {
        // 本地没有这篇博文, 直接将博文下载到本地即可
        return void (await openPostInVscode(postId, false))
    }

    await revealPostsListItem(post)
    contexts.push({ postId: postId, fileUri: Uri.file(filePath) })
}

const parseUriInput = (input: InputType): Uri | undefined => {
    if (input instanceof Uri) return input

    const { document } = window.activeTextEditor ?? {}
    if (document && !document.isUntitled) return document.uri
}

const handleUriInput = (fileUri: Uri, contexts: CommandContext[]): Promise<void> => {
    const postId = PostFileMapManager.getPostId(fileUri.fsPath)
    if (!postId) return Promise.resolve().then(() => AlertService.fileNotLinkedToPost(fileUri))

    contexts.push({ postId, fileUri })
    return Promise.resolve()
}

const update = async (contexts: CommandContext[]) => {
    for (const ctx of contexts) {
        const { fileUri, postId } = ctx
        const { post } = (await PostService.fetchPostEditDto(postId)) ?? {}
        if (post) {
            const textEditors = window.visibleTextEditors.filter(x => x.document.uri.fsPath === fileUri.fsPath)
            await Promise.all(textEditors.map(editor => editor.document.save()))
            await workspace.fs.writeFile(fileUri, Buffer.from(post.postBody))
        }
    }
}

const resolveFileNames = (ctxs: CommandContext[]) => `"${ctxs.map(x => path.basename(x.fileUri.fsPath)).join('", ')}"`
