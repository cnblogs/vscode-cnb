import { TextDocumentShowOptions, Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { LocalDraft } from '@/service/local-draft'
import { PostFileMapManager } from '@/service/post/post-file-map'

export async function openPostFile(post: LocalDraft | Post | string, options?: TextDocumentShowOptions) {
    let filePath = ''
    if (post instanceof LocalDraft) filePath = post.filePath
    else if (post instanceof Post) filePath = PostFileMapManager.getFilePath(post.id) ?? ''
    else filePath = post

    if (!filePath) return

    await execCmd(
        'vscode.open',
        Uri.file(filePath),
        Object.assign({ preview: false } as TextDocumentShowOptions, options ?? {})
    )
}
