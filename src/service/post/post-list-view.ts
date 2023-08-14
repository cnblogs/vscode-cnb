import { Post } from '@/model/post'
import { extTreeViews } from '@/tree-view/tree-view-register'

export async function revealPostListItem(
    post: Post | undefined,
    options?: { select?: boolean; focus?: boolean; expand?: boolean | number }
) {
    if (post === undefined) return

    const view = extTreeViews.visiblePostList()
    await view?.reveal(post, options)
}
