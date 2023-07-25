import fetch from '@/infra/fetch-client'
import { Post } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PageModel } from '@/model/page-model'
import { PostListState } from '@/model/post-list-state'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostUpdatedResponse } from '@/model/post-updated-response'
import { throwIfNotOkGotResponse } from '@/infra/response-err'
import { IErrorResponse } from '@/model/error-response'
import { Alert } from './alert'
import { PostFileMapManager } from './post-file-map'
import { ZzkSearchResult } from '@/model/zzk-search-result'
import got from '@/infra/http-client'
import httpClient from '@/infra/http-client'
import iconv from 'iconv-lite'

const defaultPageSize = 30
let newPostTemplate: PostEditDto | undefined

export namespace PostService {
    const getBaseUrl = () => globalCtx.config.apiBaseUrl

    export const getPostListState = () => globalCtx.storage.get<PostListState>('postListState')

    export async function fetchPostList({
        search = '',
        pageIndex = 1,
        pageSize = defaultPageSize,
        categoryId = <null | number>null,
    }): Promise<
        PageModel<Post> & {
            zzkSearchResult?: ZzkSearchResult
        }
    > {
        const s = new URLSearchParams([
            ['t', '1'],
            ['p', `${pageIndex}`],
            ['s', `${pageSize}`],
            ['search', search],
            ['cid', categoryId != null && categoryId > 0 ? `${categoryId}` : ''],
        ])
        const response = await fetch(`${getBaseUrl()}/api/posts/list?${s.toString()}`, {
            method: 'GET',
        })
        if (!response.ok) throw Error(`请求博文列表失败: ${response.status}, ${await response.text()}`)

        const obj = <PostListModel>await response.json()
        const { zzkSearchResult } = obj

        return Object.assign(
            new PageModel(
                obj.pageIndex,
                obj.pageSize,
                obj.postCount,
                obj.postList.map(x => Object.assign(new Post(), x))
            ),
            { zzkSearchResult: ZzkSearchResult.parse(zzkSearchResult) || undefined }
        )
    }

    export async function fetchPostEditDto(
        postId: number,
        muteErrorNotification = false
    ): Promise<PostEditDto | undefined> {
        const response = await httpClient.get(`${getBaseUrl()}/api/posts/${postId}`, {
            throwHttpErrors: false,
            responseType: 'buffer',
        })

        try {
            throwIfNotOkGotResponse(response)
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

        const decodedBody = iconv.decode(response.rawBody, 'utf-8')

        const { blogPost, myConfig } = JSON.parse(decodedBody) as { blogPost?: Post; myConfig?: unknown }

        return blogPost ? new PostEditDto(Object.assign(new Post(), blogPost), myConfig) : undefined
    }

    export async function deletePost(...postIds: number[]) {
        if (postIds.length === 1) {
            const res = await fetch(`${getBaseUrl()}/api/posts/${postIds[0]}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`)
        } else {
            const searchParams = new URLSearchParams(postIds.map<[string, string]>(id => ['postIds', `${id}`]))
            const res = await fetch(`${getBaseUrl()}/api/bulk-operation/post?${searchParams.toString()}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`)
        }
    }

    export async function updatePost(post: Post): Promise<PostUpdatedResponse> {
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

    export async function updatePostListState(state: PostListState | undefined | PageModel<Post>) {
        const finalState: PostListState | undefined =
            state instanceof PageModel
                ? {
                      pageIndex: state.pageIndex,
                      pageSize: state.pageSize,
                      totalItemsCount: state.totalItemsCount,
                      itemsCount: state.items?.length ?? 0,
                      timestamp: new Date(),
                      hasNext: state.hasNext,
                      hasPrevious: state.hasPrevious,
                      pageCount: state.pageCount,
                  }
                : state
        await globalCtx.storage.update('postListState', finalState)
    }

    export async function fetchPostEditTemplate(): Promise<PostEditDto | undefined> {
        if (!newPostTemplate) newPostTemplate = await fetchPostEditDto(-1)

        return newPostTemplate
            ? new PostEditDto(
                  Object.assign(new Post(), newPostTemplate.post),
                  Object.assign({}, newPostTemplate.config)
              )
            : undefined
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
