import { Post } from '@/model/post'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { PostListState } from '@/model/post-list-state'
import { LocalState } from '@/ctx/local-state'
import { PostListRespItem } from '@/model/post-list-resp-item'
import { ZzkSearchResult } from '@/model/zzk-search-result'

export interface PostListModel {
    category: unknown // TODO: need type
    categoryName: string
    pageIndex: number
    pageSize: number
    postList: PostListRespItem[]
    postsCount: number

    zzkSearchResult: ZzkSearchResult | null
}

export async function revealPostListItem(
    post: Post | undefined,
    options?: { select?: boolean; focus?: boolean; expand?: boolean | number }
) {
    if (post === undefined) return

    const view = extTreeViews.visiblePostList()

    try {
        await view?.reveal(post, options)
    } catch (ex) {
        console.log(ex)
    }
}

export function getListState() {
    return LocalState.getState('postListState') as PostListState | undefined
}

export async function updatePostListState(
    pageIndex: number,
    pageSize: number,
    pageCount: number,
    hasPrev: boolean,
    hasNext: boolean
): Promise<void> {
    const finalState = {
        pageIndex,
        pageSize,
        pageCount,
        hasPrev,
        hasNext,
    } as PostListState
    await LocalState.setState('postListState', finalState)
}
