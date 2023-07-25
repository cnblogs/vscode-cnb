import { Post } from '@/model/post'
import { extTreeViews } from '@/tree-view/tree-view-register'

export const revealPostListItem = async (
    post: Post,
    options?: { select?: boolean; focus?: boolean; expand?: boolean | number }
) => {
    if (!post) return

    const view = extTreeViews.visiblePostList()
    await view?.reveal(post, options)
}
