import fetch from '@/infra/fetch-client'
import { Post } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PageModel } from '@/model/page-model'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostUpdatedResponse } from '@/model/post-updated-response'
import { throwIfNotOkGotResponse } from '@/infra/response-err'
import { IErrorResponse } from '@/model/error-response'
import { PostFileMapManager } from './post-file-map'
import { ZzkSearchResult } from '@/model/zzk-search-result'
import got from '@/infra/http-client'
import httpClient from '@/infra/http-client'
import iconv from 'iconv-lite'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { rmYfm } from '@/infra/filter/rm-yfm'
import { PostListState } from '@/model/post-list-state'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url'
import { consReqHeader } from '@/infra/http/infra/header'
import { AuthedReq } from '@/infra/http/authed-req'

let newPostTemplate: PostEditDto | undefined

const getBaseUrl = () => globalCtx.config.apiBaseUrl

export namespace PostService {
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
        const model = <PostListModel>await JSON.parse(resp)

        return Object.assign(
            new PageModel(
                model.pageIndex,
                model.pageSize,
                model.postCount,
                model.postList.map(x => Object.assign(new Post(), x))
            ),
            { zzkSearchResult: ZzkSearchResult.parse(model.zzkSearchResult) || undefined }
        )
    }

    export async function fetchPostEditDto(postId: number, muteErrorNotification = false) {
        const res = await httpClient.get(`${getBaseUrl()}/api/posts/${postId}`, {
            throwHttpErrors: false,
            responseType: 'buffer',
        })

        try {
            throwIfNotOkGotResponse(res)
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

        const decodedBody = iconv.decode(res.rawBody, 'utf-8')

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
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                void Alert.err(`删除博文失败: ${e}`)
            }
        } else {
            const para = consUrlPara(...postIds.map(id => ['postIds', id.toString()] as [string, string]))
            const url = `${getBaseUrl()}/api/bulk-operation/post?${para}`
            try {
                await AuthedReq.del(url, consReqHeader())
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                void Alert.err(`删除博文失败: ${e}`)
            }
        }
    }

    export async function updatePost(post: Post) {
        if (MarkdownCfg.isIgnoreYfmWhenUploadPost()) post.postBody = rmYfm(post.postBody)
        const {
            ok: isOk,
            url,
            method,
            body,
            statusCode,
            statusMessage,
        } = await got.post<PostUpdatedResponse>(`${getBaseUrl()}/api/posts`, { json: post, responseType: 'json' })
        if (!isOk) throw new Error(`Failed to ${method} ${url}, ${statusCode} - ${statusMessage}`)
        return PostUpdatedResponse.parse(body)
    }

    export async function updatePostListState(state: PostListState | PageModel<Post>) {
        if (state instanceof PageModel) {
            const finalState = {
                pageIndex: state.pageIndex,
                pageSize: state.pageSize,
                totalItemsCount: state.totalItemsCount,
                itemsCount: state.items?.length ?? 0,
                timestamp: new Date(),
                hasNext: state.hasNext,
                hasPrevious: state.hasPrevious,
                pageCount: state.pageCount,
            }
            await globalCtx.storage.update('postListState', finalState)
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
    categoryName: string
    pageIndex: number
    pageSize: number
    postList: []
    postCount: number
    zzkSearchResult?: ZzkSearchResult
}
