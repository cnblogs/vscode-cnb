import { Uri, window, workspace } from 'vscode'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { buildLocalPostFileUri } from '@/cmd/post-list/open-post-in-vscode'
import { PostService } from '@/service/post/post'
import { Alert } from '@/infra/alert'
import path from 'path'
import { revealPostListItem } from '@/service/post/post-list-view'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { fsUtil } from '@/infra/fs/fsUtil'

export async function postPull(input: Post | PostTreeItem | Uri | undefined | null, showConfirm = true, mute = false) {
    const ctxList: CmdCtx[] = []
    let isFreshPull = false
    input = input instanceof PostTreeItem ? input.post : input
    if (parsePostInput(input) && input.id > 0) {
        const post = input
        const path = PostFileMapManager.getFilePath(post.id)
        if (path === undefined || !(await fsUtil.exists(path))) {
            isFreshPull = true
            const uri = await buildLocalPostFileUri(post, false)
            await workspace.fs.writeFile(uri, Buffer.from(post.postBody))
            await PostFileMapManager.updateOrCreate(post.id, uri.path)
            await handlePostInput(input, ctxList, uri.path)
        } else {
            isFreshPull = !(await fsUtil.exists(path))
            await handlePostInput(input, ctxList, path)
        }
    } else {
        const uri = parseUriInput(input)
        if (uri !== undefined) handleUriInput(uri, ctxList)
    }

    const fileName = resolveFileNames(ctxList)

    if (showConfirm && !isFreshPull && MarkdownCfg.isShowConfirmMsgWhenPullPost()) {
        const answer = await Alert.warn(
            '确认要拉取远程博文吗?',
            {
                modal: true,
                detail: `本地文件「${fileName}」将被覆盖(可通过设置关闭对话框)`,
            },
            '确认'
        )
        if (answer !== '确认') return
    }

    if (ctxList.length <= 0) return

    await update(ctxList)

    if (!mute) {
        if (isFreshPull) await Alert.info(`博文已下载至本地：${resolveFileNames(ctxList)}`)
        else await Alert.info(`本地文件已更新: ${resolveFileNames(ctxList)}`)
    }
}

type InputType = Post | Uri | undefined | null
type CmdCtx = {
    postId: number
    fileUri: Uri
}

const parsePostInput = (input: InputType): input is Post => input instanceof Post

async function handlePostInput(post: Post, contexts: CmdCtx[], path: string) {
    await revealPostListItem(post)
    contexts.push({ postId: post.id, fileUri: Uri.file(path) })
}

function parseUriInput(input: InputType): Uri | undefined {
    if (input instanceof Uri) return input

    const doc = window.activeTextEditor?.document
    if (doc !== undefined && !doc.isUntitled) return doc.uri
}

function handleUriInput(fileUri: Uri, contexts: CmdCtx[]) {
    const postId = PostFileMapManager.getPostId(fileUri.fsPath)
    if (postId === undefined) return Alert.fileNotLinkedToPost(fileUri)

    contexts.push({ postId, fileUri })
}

async function update(contexts: CmdCtx[]) {
    for (const ctx of contexts) {
        const { fileUri, postId } = ctx

        const { post } = await PostService.getPostEditDto(postId)

        const textEditors = window.visibleTextEditors.filter(x => x.document.uri.fsPath === fileUri.fsPath)
        await Promise.all(textEditors.map(editor => editor.document.save()))
        await workspace.fs.writeFile(fileUri, Buffer.from(post.postBody))
    }
}

function resolveFileNames(ctxList: CmdCtx[]) {
    const arr = ctxList.map(x => path.basename(x.fileUri.fsPath))
    return `${arr.join(', ')}`
}
