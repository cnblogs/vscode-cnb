import { MyConfig, Post, PostListRespItem } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostUpdatedResp } from '@/model/post-updated-response'
import { ZzkSearchResult } from '@/model/zzk-search-result'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { rmYfm } from '@/infra/filter/rm-yfm'
import { PostListState } from '@/model/post-list-state'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { consHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { AuthedReq } from '@/infra/http/authed-req'
import { Page, PageList } from '@/model/page'

let newPostTemplate: PostEditDto | undefined

const getBaseUrl = () => globalCtx.config.apiBaseUrl

export namespace PostService {
    import ContentType = ReqHeaderKey.ContentType
    export const getPostListState = () => globalCtx.storage.get<PostListState>('postListState')

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

    export async function fetchPostEditDto(postId: number) {
        const url = `${getBaseUrl()}/api/posts/${postId}`

        try {
            const resp = await AuthedReq.get(url, consHeader())

            const { blogPost, myConfig } = <{ blogPost?: Post; myConfig?: MyConfig }>JSON.parse(resp)

            if (blogPost === undefined) return

            return <PostEditDto>{
                post: Object.assign(new Post(), blogPost),
                config: myConfig,
            }
        } catch (e) {
            void Alert.err(`获取博文失败: ${<string>e}`)
        }
    }

    export async function delPost(...postIds: number[]) {
        if (postIds.length === 1) {
            const url = `${getBaseUrl()}/api/posts/${postIds[0]}`
            try {
                await AuthedReq.del(url, consHeader())
            } catch (e) {
                void Alert.err(`删除博文失败: ${<string>e}`)
            }
        } else {
            const para = consUrlPara(...postIds.map(id => ['postIds', id.toString()] as [string, string]))
            const url = `${getBaseUrl()}/api/bulk-operation/post?${para}`
            try {
                await AuthedReq.del(url, consHeader())
            } catch (e) {
                void Alert.err(`删除博文失败: ${<string>e}`)
            }
        }
    }

    export async function updatePost(post: Post) {
        if (MarkdownCfg.isIgnoreYfmWhenUploadPost()) post.postBody = rmYfm(post.postBody)
        const url = `${getBaseUrl()}/api/posts`
        const body = JSON.stringify(post)
        const header = consHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appJson])
        const resp = await AuthedReq.post(url, header, body)

        return <PostUpdatedResp>JSON.parse(resp)
    }

    export async function updatePostListStateNg(
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
        await globalCtx.storage.update('postListState', finalState)
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
