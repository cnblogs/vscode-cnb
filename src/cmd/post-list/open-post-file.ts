import { TextDocumentShowOptions, Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { LocalPost } from '@/service/local-post'
import { fsUtil } from '@/infra/fs/fsUtil'
import { postPull } from './post-pull'
import { Alert } from '@/infra/alert'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export async function openPostFile(
    post: LocalPost | Post | string,
    options?: TextDocumentShowOptions,
    autoPull = false
) {
    let filePath = ''
    if (post instanceof LocalPost) {
        filePath = post.filePath
    } else if (post instanceof Post) {
        filePath = PostFileMapManager.getFilePath(post.id) ?? ''
        if (autoPull) {
            if (!(await fsUtil.exists(filePath)) || filePath.indexOf(WorkspaceCfg.getWorkspaceUri().path) < 0)
                await postPull(post, false, true)
        }
    } else {
        filePath = post
    }

    if (filePath === '') return

    if (!(await fsUtil.exists(filePath))) await new Promise(f => setTimeout(f, 200))

    try {
        await openFile(filePath, options)
    } catch (e) {
        await new Promise(f => setTimeout(f, 500))
        try {
            await openFile(filePath, options)
        } catch (e2) {
            await Alert.err(`打开本地博文文件失败，重新操作通常可恢复，错误信息： ${<string>e2}`)
        }
    }
}

function openFile(filePath: string, options?: TextDocumentShowOptions) {
    return execCmd(
        'vscode.open',
        Uri.file(filePath),
        Object.assign({ preview: false } as TextDocumentShowOptions, options ?? {})
    )
}
