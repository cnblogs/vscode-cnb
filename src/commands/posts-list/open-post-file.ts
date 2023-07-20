import { TextDocumentShowOptions, Uri } from 'vscode'
import { execCmd } from '@/utils/cmd'
import { Post } from '@/models/post'
import { LocalDraft } from '@/services/local-draft.service'
import { PostFileMapManager } from '@/services/post-file-map'

export const openPostFile = async (post: LocalDraft | Post | string, options?: TextDocumentShowOptions) => {
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
