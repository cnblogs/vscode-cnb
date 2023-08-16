import { TextDocumentShowOptions, Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { LocalPost } from '@/service/local-post'
import { PostFileMapManager } from '@/service/post/post-file-map'

export async function openPostFile(post: LocalPost | Post | string, options?: TextDocumentShowOptions) {
    let filePath = ''
    if (post instanceof LocalPost) filePath = post.filePath
    else if (post instanceof Post) filePath = PostFileMapManager.getFilePath(post.id) ?? ''
    else filePath = post

    if (!filePath) return

    await execCmd(
        'vscode.open',
        Uri.file(filePath),
        Object.assign({ preview: false } as TextDocumentShowOptions, options ?? {})
    )
}
