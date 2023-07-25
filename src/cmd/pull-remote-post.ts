import { MessageOptions, Uri, window, workspace } from 'vscode'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post-file-map'
import { openPostInVscode } from './post-list/open-post-in-vscode'
import fs from 'fs'
import { PostService } from '@/service/post'
import { Alert } from '@/infra/alert'
import path from 'path'
import { revealPostListItem } from '@/service/post-list-view'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { MarkdownCfg } from '@/ctx/cfg/markdown'

export async function pullRemotePost(input: Post | PostTreeItem | Uri | undefined | null) {
    const ctxList: CmdCtx[] = []
    let uri: Uri | undefined
    input = input instanceof PostTreeItem ? input.post : input
    if (parsePostInput(input) && input.id > 0) await handlePostInput(input, ctxList)
    else if ((uri = parseUriInput(input))) await handleUriInput(uri, ctxList)

    if (MarkdownCfg.isShowConfirmMsgWhenPullPost()) {
        const answer = await Alert.warn(
            '确认要拉取远程博文吗?',
            {
                modal: true,
                detail: `本地文件 ${resolveFileNames(ctxList)} 将被覆盖, 请谨慎操作!(此消息可在设置中关闭)`,
            } as MessageOptions,
            '确认'
        )
        if (answer !== '确认') return
    }

    if (ctxList.length <= 0) return

    await update(ctxList)

    void Alert.info(`本地文件${resolveFileNames(ctxList)}已更新`)
}

type InputType = Post | Uri | undefined | null
type CmdCtx = { postId: number; fileUri: Uri }

const parsePostInput = (input: InputType): input is Post => input instanceof Post

const handlePostInput = async (post: Post, contexts: CmdCtx[]) => {
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

    await revealPostListItem(post)
    contexts.push({ postId: postId, fileUri: Uri.file(filePath) })
}

const parseUriInput = (input: InputType): Uri | undefined => {
    if (input instanceof Uri) return input

    const { document } = window.activeTextEditor ?? {}
    if (document && !document.isUntitled) return document.uri
}

const handleUriInput = (fileUri: Uri, contexts: CmdCtx[]): Promise<void> => {
    const postId = PostFileMapManager.getPostId(fileUri.fsPath)
    if (!postId) return Promise.resolve().then(() => Alert.fileNotLinkedToPost(fileUri))

    contexts.push({ postId, fileUri })
    return Promise.resolve()
}

const update = async (contexts: CmdCtx[]) => {
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

const resolveFileNames = (ctxList: CmdCtx[]) => `"${ctxList.map(x => path.basename(x.fileUri.fsPath)).join('", ')}"`
