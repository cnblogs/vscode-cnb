import { Uri } from 'vscode'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { Browser } from '@/cmd/browser'

export const openPostInBlogAdmin = (arg?: PostTreeItem | Post | Uri) => {
    if (arg instanceof Post) {
        const postId = arg.id
        return Browser.Open.open(`https://i.cnblogs.com/posts/edit;postId=${postId}`)
    }
    if (arg instanceof PostTreeItem) {
        const postId = arg.post.id
        return Browser.Open.open(`https://i.cnblogs.com/posts/edit;postId=${postId}`)
    }
    if (arg instanceof Uri) {
        const postId = PostFileMapManager.getPostId(arg.path)
        if (postId === undefined) return
        return Browser.Open.open(`https://i.cnblogs.com/posts/edit;postId=${postId}`)
    }
}
