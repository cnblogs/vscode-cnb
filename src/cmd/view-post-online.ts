import { Uri, window } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostService } from '@/service/post/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'

export async function viewPostOnline(input?: Post | PostTreeItem | Uri) {
    let post: Post | undefined = input instanceof Post ? input : input instanceof PostTreeItem ? input.post : undefined
    if (input === undefined) input = window.activeTextEditor?.document.uri

    if (input instanceof Uri) {
        const postId = PostFileMapManager.getPostId(input.path)
        if (postId !== undefined) post = (await PostService.getPostEditDto(postId))?.post
    }

    if (post === undefined) return

    await execCmd('vscode.open', Uri.parse(post.url))
}
