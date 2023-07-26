import fetch from '@/utils/fetch-client'
import { Post } from '@/models/post'
import { globalCtx } from './global-ctx'
import { PageModel } from '@/models/page-model'
import { PostsListState } from '@/models/posts-list-state'
import { PostEditDto } from '@/models/post-edit-dto'
import { PostUpdatedResponse } from '@/models/post-updated-response'
import { throwIfNotOkGotResponse } from '@/utils/throw-if-not-ok-response'
import { IErrorResponse } from '@/models/error-response'
import { AlertService } from './alert.service'
import { PostFileMapManager } from './post-file-map'
import { ZzkSearchResult } from '@/models/zzk-search-result'
import got from '@/utils/http-client'
import httpClient from '@/utils/http-client'
import iconv from 'iconv-lite'

const defaultPageSize = 30
let newPostTemplate: PostEditDto | undefined

export namespace PostService {
    const getBaseUrl = () => globalCtx.config.apiBaseUrl

    export const getPostsListState = () => globalCtx.storage.get<PostsListState>('postsListState')

    export async function fetchPostsList({
        search = '',
        pageIndex = 1,
        pageSize = defaultPageSize,
        categoryId = <null | number>null,
    }) {
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
                obj.postsCount,
                obj.postList.map(x => Object.assign(new Post(), x))
            ),
            { zzkSearchResult: ZzkSearchResult.parse(zzkSearchResult) || undefined }
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
                    AlertService.err('博文不存在')
                    const postFilePath = PostFileMapManager.getFilePath(postId)
                    if (postFilePath) await PostFileMapManager.updateOrCreate(postId, '')
                } else {
                    AlertService.err(errors.join('\n'))
                }
            }
            return undefined
        }

        const decodedBody = iconv.decode(res.rawBody, 'utf-8')

        const { blogPost, myConfig } = JSON.parse(decodedBody) as { blogPost?: Post; myConfig?: unknown }

        if (blogPost !== undefined) return new PostEditDto(Object.assign(new Post(), blogPost), myConfig)

        return undefined
    }

    export async function deletePost(postId: number) {
        const res = await fetch(`${getBaseUrl()}/api/posts/${postId}`, {
            method: 'DELETE',
        })
        if (!res.ok) throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`)
    }

    export async function deletePosts(postIds: number[]) {
        const searchParams = new URLSearchParams(postIds.map<[string, string]>(id => ['postIds', `${id}`]))
        const res = await fetch(`${getBaseUrl()}/api/bulk-operation/post?${searchParams.toString()}`, {
            method: 'DELETE',
        })
        if (!res.ok) throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`)
    }

    export async function updatePost(post: Post) {
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

    export async function updatePostsListState(state: PostsListState | PageModel<Post>) {
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
            await globalCtx.storage.update('postsListState', finalState)
        }

        await globalCtx.storage.update('postsListState', state)
    }

    export async function fetchPostEditTemplate(): Promise<PostEditDto | undefined> {
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
    postsCount: number
    zzkSearchResult?: ZzkSearchResult
}
