import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'

export function osOpenLocalPostFile(post?: Post | PostTreeItem) {
    if (post === undefined) {
        console.error('post is undefined in osOpenLocalPostFile')
        return
    }

    post = post instanceof PostTreeItem ? post.post : post
    const postFilePath = PostFileMapManager.getFilePath(post.id)
    if (postFilePath === undefined) return

    return execCmd('revealFileInOS', Uri.file(postFilePath))
}
