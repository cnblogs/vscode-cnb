import { Post } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PageModel } from '@/model/page-model'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostUpdatedResponse } from '@/model/post-updated-response'
import { throwIfNotOkGotResponse } from '@/infra/response-err'
import { IErrorResponse } from '@/model/error-response'
import { PostFileMapManager } from './post-file-map'
import { ZzkSearchResult } from '@/model/zzk-search-result'
import httpClient from '@/infra/http-client'
import iconv from 'iconv-lite'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { rmYfm } from '@/infra/filter/rm-yfm'
import { PostListState } from '@/model/post-list-state'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url'
import { consReqHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { AuthedReq } from '@/infra/http/authed-req'

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
        const resp = await AuthedReq.get(url, consReqHeader())
        const listModel = <PostListModel>JSON.parse(resp)

        const pageModel = new PageModel(
            listModel.pageIndex,
            listModel.pageSize,
            listModel.postsCount,
            listModel.postList.map(x => Object.assign(new Post(), x))
        )

        return Object.assign(pageModel, {
            zzkSearchResult: ZzkSearchResult.parse(listModel.zzkSearchResult) || undefined,
        })
    }

    export async function fetchPostEditDto(postId: number, muteErrorNotification = false) {
        const resp = await httpClient.get(`${getBaseUrl()}/api/posts/${postId}`, {
            throwHttpErrors: false,
            responseType: 'buffer',
        })

        try {
            throwIfNotOkGotResponse(resp)
        } catch (e) {
            const { statusCode, errors } = e as IErrorResponse
            if (!muteErrorNotification) {
                if (statusCode === 404) {
                    void Alert.err('博文不存在')
                    const postFilePath = PostFileMapManager.getFilePath(postId)
                    if (postFilePath) await PostFileMapManager.updateOrCreate(postId, '')
                } else {
                    void Alert.err(errors.join('\n'))
                }
            }
            return undefined
        }

        const decodedBody = iconv.decode(resp.rawBody, 'utf-8')

        const { blogPost, myConfig } = JSON.parse(decodedBody) as { blogPost?: Post; myConfig?: unknown }

        if (blogPost !== undefined) return new PostEditDto(Object.assign(new Post(), blogPost), myConfig)

        return undefined
    }

    export async function deletePost(...postIds: number[]) {
        if (postIds.length === 1) {
            const url = `${getBaseUrl()}/api/posts/${postIds[0]}`
            try {
                await AuthedReq.del(url, consReqHeader())
            } catch (e) {
                void Alert.err(`删除博文失败: ${<string>e}`)
            }
        } else {
            const para = consUrlPara(...postIds.map(id => ['postIds', id.toString()] as [string, string]))
            const url = `${getBaseUrl()}/api/bulk-operation/post?${para}`
            try {
                await AuthedReq.del(url, consReqHeader())
            } catch (e) {
                void Alert.err(`删除博文失败: ${<string>e}`)
            }
        }
    }

    export async function updatePost(post: Post) {
        if (MarkdownCfg.isIgnoreYfmWhenUploadPost()) post.postBody = rmYfm(post.postBody)
        const url = `${getBaseUrl()}/api/posts`
        const body = JSON.stringify(post)
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appJson])
        const resp = await AuthedReq.post(url, header, body)

        return PostUpdatedResponse.parse(JSON.parse(resp))
    }

    export async function updatePostListState(state: PostListState | PageModel<Post>) {
        if (state instanceof PageModel) {
            const finalState = {
                pageIndex: state.pageIndex,
                pageSize: state.pageSize,
                itemsCount: state.items?.length ?? 0,
                timestamp: new Date(),
                hasNext: state.hasNext,
                hasPrevious: state.hasPrevious,
                pageCount: state.pageCount,
            }
            await globalCtx.storage.update('postListState', finalState)
            return
        }

        await globalCtx.storage.update('postListState', state)
    }

    export async function fetchPostEditTemplate() {
        newPostTemplate ??= await fetchPostEditDto(-1)
        if (newPostTemplate === undefined) return undefined

        return new PostEditDto(
            Object.assign(new Post(), newPostTemplate.post),
            Object.assign({}, newPostTemplate.config)
        )
    }
}

interface PostListModel {
    category: unknown
    categoryName: string
    pageIndex: number
    pageSize: number
    postList: []
    postsCount: number
    zzkSearchResult?: ZzkSearchResult
}
