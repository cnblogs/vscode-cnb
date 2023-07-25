import { Post } from '@/models/post'
import { extTreeViews } from '@/tree-view-providers/tree-view-registration'

export const revealPostListItem = async (
    post: Post,
    options?: { select?: boolean; focus?: boolean; expand?: boolean | number }
) => {
    if (!post) return

    const view = extTreeViews.visiblePostList()
    await view?.reveal(post, options)
}
