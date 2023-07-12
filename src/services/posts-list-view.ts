import { Post } from '@/models/post'
import { extensionViews } from '@/tree-view-providers/tree-view-registration'

export const revealPostsListItem = async (
    post: Post,
    options?: { select?: boolean; focus?: boolean; expand?: boolean | number }
) => {
    if (!post) return

    const view = extensionViews.visiblePostsList()
    await view?.reveal(post, options)
}
