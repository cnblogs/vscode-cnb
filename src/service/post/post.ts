import { globalCtx } from '@/ctx/global-ctx'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostUpdatedResp } from '@/model/post-updated-response'
import { ZzkSearchResult } from '@/model/zzk-search-result'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { rmYfm } from '@/infra/filter/rm-yfm'
import { PostListState } from '@/model/post-list-state'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { consHeader } from '@/infra/http/infra/header'
import { AuthedReq } from '@/infra/http/authed-req'
import { Page, PageList } from '@/model/page'
import { Post } from '@/model/post'
import { PostListRespItem } from '@/model/post-list-resp-item'
import { MyConfig } from '@/model/my-config'
import { AuthManager } from '@/auth/auth-manager'
import { PostReq } from '@/wasm'
import { LocalState } from '@/ctx/local-state'

let newPostTemplate: PostEditDto | undefined

const getBaseUrl = () => globalCtx.config.apiBaseUrl

async function getAuthedPostReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new PostReq(token, isPatToken)
}

export namespace PostService {
    export const getPostListState = () => <PostListState>LocalState.getState('postListState')

    export async function fetchPostList({ search = '', pageIndex = 1, pageSize = 30, categoryId = <'' | number>'' }) {
        const para = consUrlPara(
            ['t', '1'],
            ['p', pageIndex.toString()],
            ['s', pageSize.toString()],
            ['search', search],
            ['cid', categoryId.toString()]
        )
        const url = `${getBaseUrl()}/api/posts/list?${para}`
        const resp = await AuthedReq.get(url, consHeader())
        const listModel = <PostListModel>JSON.parse(resp)
        const page = {
            index: listModel.pageIndex,
            cap: listModel.pageSize,
            items: listModel.postList.map(x => Object.assign(new Post(), x)),
        } as Page<Post>

        return {
            page,
            pageCount: PageList.calcPageCount(listModel.pageSize, listModel.postsCount),
            matchedPostCount: listModel.postsCount,
            zzkResult: listModel.zzkSearchResult,
        }
    }

    // TODO: need better impl
    export async function* allPostIter() {
        const result = await PostService.fetchPostList({ pageSize: 1 })
        const postCount = result.matchedPostCount
        for (const i of Array(postCount).keys()) {
            const { page } = await PostService.fetchPostList({ pageIndex: i + 1, pageSize: 1 })
            const id = page.items[0].id
            const dto = await PostService.fetchPostEditDto(id)
            yield dto.post
        }
    }

    export async function fetchPostEditDto(postId: number) {
        const url = `${getBaseUrl()}/api/posts/${postId}`

        try {
            const resp = await AuthedReq.get(url, consHeader())

            const { blogPost, myConfig } = <{ blogPost?: Post; myConfig?: MyConfig }>JSON.parse(resp)

            // TODO: need better impl
            if (blogPost === undefined) throw Error('博文不存在')

            return <PostEditDto>{
                post: Object.assign(new Post(), blogPost),
                config: myConfig,
            }
        } catch (e) {
            void Alert.err(`获取博文失败: ${<string>e}`)
            throw e
        }
    }

    export async function delPost(...postIds: number[]) {
        const req = await getAuthedPostReq()
        try {
            if (postIds.length === 1) await req.delOne(postIds[0])
            else await req.delSome(new Uint32Array(postIds))
        } catch (e) {
            void Alert.err(`删除博文失败: ${<string>e}`)
        }
    }

    export async function updatePost(post: Post) {
        if (MarkdownCfg.isIgnoreYfmWhenUploadPost()) post.postBody = rmYfm(post.postBody)
        const body = JSON.stringify(post)
        const req = await getAuthedPostReq()
        const resp = await req.update(body)

        return <PostUpdatedResp>JSON.parse(resp)
    }

    export async function updatePostListState(
        pageIndex: number,
        pageCap: number,
        pageItemCount: number,
        pageCount: number
    ) {
        const hasPrev = PageList.hasPrev(pageIndex)
        const hasNext = PageList.hasNext(pageIndex, pageCount)

        const finalState = {
            pageIndex,
            pageCap,
            pageItemCount,
            pageCount,
            hasPrev,
            hasNext,
        } as PostListState
        await LocalState.setState('postListState', finalState)
    }

    export async function fetchPostEditTemplate() {
        newPostTemplate ??= await fetchPostEditDto(-1)
        if (newPostTemplate === undefined) return undefined

        return <PostEditDto>{
            post: Object.assign(new Post(), newPostTemplate.post),
            config: Object.assign({}, newPostTemplate.config),
        }
    }
}

interface PostListModel {
    category: unknown // TODO: need type
    categoryName: string
    pageIndex: number
    pageSize: number
    postList: PostListRespItem[]
    postsCount: number

    zzkSearchResult: ZzkSearchResult | null
}
