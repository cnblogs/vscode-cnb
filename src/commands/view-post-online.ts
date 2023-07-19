import { commands, Uri, window } from 'vscode'
import { Post } from '@/models/post'
import { PostService } from '@/services/post.service'
import { PostFileMapManager } from '@/services/post-file-map'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'

export const viewPostOnline = async (input?: Post | PostTreeItem | Uri) => {
    let post: Post | undefined = input instanceof Post ? input : input instanceof PostTreeItem ? input.post : undefined
    if (!input) input = window.activeTextEditor?.document.uri

    if (input instanceof Uri) {
        const postId = PostFileMapManager.getPostId(input.fsPath)
        if (postId !== undefined) post = (await PostService.fetchPostEditDto(postId))?.post
    }

    if (!post) return

    await commands.executeCommand('vscode.open', Uri.parse(post.url))
}
