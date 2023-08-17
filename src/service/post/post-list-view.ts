import { Post } from '@/model/post'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { PageList } from '@/model/page'
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
    await view?.reveal(post, options)
}

export function getListState() {
    return <PostListState | undefined>LocalState.getState('postListState')
}

export async function updatePostListState(
    pageIndex: number,
    pageCap: number,
    pageItemCount: number,
    pageCount: number
) {
    const hasPrev = PageList.hasPrev(pageIndex)
    const hasNext = PageList.hasNext(pageIndex, pageCount)

    const finalState = <PostListState>{
        pageIndex,
        pageCap,
        pageItemCount,
        pageCount,
        hasPrev,
        hasNext,
    }
    await LocalState.setState('postListState', finalState)
}
