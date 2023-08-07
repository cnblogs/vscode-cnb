import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'

export const openPostInBlogAdmin = (item: Post | PostTreeItem | Uri) => {
    if (!item) return

    item = item instanceof PostTreeItem ? item.post : item
    const postId = item instanceof Post ? item.id : PostFileMapManager.getPostId(item.fsPath) ?? -1

    void execCmd('vscode.open', Uri.parse(`https://i.cnblogs.com/posts/edit;postId=${postId}`))
}
