import { TextDocumentShowOptions, Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { LocalPost } from '@/service/local-post'
import { fsUtil } from '@/infra/fs/fsUtil'
import { postPull } from './post-pull'

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
            if (filePath.length === 0 || (filePath.length > 0 && !(await fsUtil.exists(filePath))))
                if (await postPull(post, true, true)) filePath = PostFileMapManager.getFilePath(post.id) ?? ''
        }
    } else {
        filePath = post
    }

    if (filePath.length > 0) await openFile(filePath, options)
}

function openFile(filePath: string, options?: TextDocumentShowOptions) {
    return execCmd(
        'vscode.open',
        Uri.file(filePath),
        Object.assign({ preview: false } as TextDocumentShowOptions, options ?? {})
    )
}
