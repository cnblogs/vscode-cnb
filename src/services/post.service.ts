import fetch from '@/utils/fetch-client';
import { Post } from '../models/post';
import { globalContext } from './global-state';
import { PageModel } from '../models/page-model';
import { PostsListState } from '../models/posts-list-state';
import { PostEditDto } from '../models/post-edit-dto';
import { PostUpdatedResponse } from '../models/post-updated-response';
import { throwIfNotOkGotResponse, throwIfNotOkResponse } from '../utils/throw-if-not-ok-response';
import { IErrorResponse } from '../models/error-response';
import { AlertService } from './alert.service';
import { PostFileMapManager } from './post-file-map';
import { ZzkSearchResult } from '../models/zzk-search-result';
import httpClient, { Options, got } from '@/utils/http-client';
import iconv from 'iconv-lite';

const defaultPageSize = 30;
let newPostTemplate: PostEditDto | undefined;

export class PostService {
    private static _instance = new PostService();

    protected constructor() {}

    protected get _baseUrl() {
        return globalContext.config.apiBaseUrl;
    }

    static get instance() {
        return this._instance;
    }

    get postsListState(): PostsListState | undefined {
        return globalContext.storage.get<PostsListState>('postsListState');
    }

    async fetchPostsList({
        search = '',
        pageIndex = 1,
        pageSize = defaultPageSize,
        categoryId = <null | number>null,
    }): Promise<
        PageModel<Post> & {
            zzkSearchResult?: ZzkSearchResult;
        }
    > {
        const s = new URLSearchParams([
            ['t', '1'],
            ['p', `${pageIndex}`],
            ['s', `${pageSize}`],
            ['search', search],
            ['cid', categoryId != null && categoryId > 0 ? `${categoryId}` : ''],
        ]);
        const response = await fetch(`${this._baseUrl}/api/posts/list?${s.toString()}`, {
            method: 'GET',
        });
        if (!response.ok) throw Error(`request failed, ${response.status}, ${await response.text()}`);

        const obj = <PostListModel>await response.json();
        const { zzkSearchResult } = obj;
        return Object.assign(
            new PageModel(
                obj.pageIndex,
                obj.pageSize,
                obj.postsCount,
                obj.postList.map(x => Object.assign(new Post(), x))
            ),
            { zzkSearchResult: ZzkSearchResult.parse(zzkSearchResult) || undefined }
        );
    }

    async fetchPostEditDto(postId: number, muteErrorNotification = false): Promise<PostEditDto | undefined> {
        // const bufferHttpClient = httpClient.extend({
        //     throwHttpErrors: false,
        //     responseType: 'buffer',
        // });

        // const response = await got(`${this._baseUrl}/api/posts/${postId}`);

        // try {
        //     throwIfNotOkGotResponse(response);
        // } catch (ex) {
        //     const { statusCode, errors } = ex as IErrorResponse;
        //     if (!muteErrorNotification) {
        //         if (statusCode === 404) {
        //             AlertService.error('博文不存在');
        //             const postFilePath = PostFileMapManager.getFilePath(postId);
        //             if (postFilePath) await PostFileMapManager.updateOrCreate(postId, '');
        //         } else {
        //             AlertService.error(errors.join('\n'));
        //         }
        //     }
        //     return undefined;
        // }

        // const decodedBody = iconv.decode(response.rawBody, 'utf-8');

        // const { blogPost, myConfig } = JSON.parse(decodedBody) as { blogPost?: Post; myConfig?: unknown };

        // return blogPost ? new PostEditDto(Object.assign(new Post(), blogPost), myConfig) : undefined;
        await new Promise<string>(() => undefined);
        return undefined;
    }

    async deletePost(postId: number) {
        const res = await fetch(`${this._baseUrl}/api/posts/${postId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`);
    }

    async deletePosts(postIds: number[]) {
        const searchParams = new URLSearchParams(postIds.map<[string, string]>(id => ['postIds', `${id}`]));
        const res = await fetch(`${this._baseUrl}/api/bulk-operation/post?${searchParams.toString()}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`);
    }

    async updatePost(post: Post): Promise<PostUpdatedResponse> {
        const {
            ok: isOk,
            url,
            method,
            body,
            statusCode,
            statusMessage,
        } = await got.post<PostUpdatedResponse>(`${this._baseUrl}/api/posts`, { json: post, responseType: 'json' });
        if (!isOk) throw new Error(`Failed to ${method} ${url}, ${statusCode} - ${statusMessage}`);
        return PostUpdatedResponse.parse(body);
    }

    async updatePostsListState(state: PostsListState | undefined | PageModel<Post>) {
        const finalState: PostsListState | undefined =
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
                : state;
        await globalContext.storage.update('postsListState', finalState);
    }

    async fetchPostEditTemplate(): Promise<PostEditDto | undefined> {
        if (!newPostTemplate) newPostTemplate = await this.fetchPostEditDto(-1);

        return newPostTemplate
            ? new PostEditDto(
                  Object.assign(new Post(), newPostTemplate.post),
                  Object.assign({}, newPostTemplate.config)
              )
            : undefined;
    }
}

export const postService = PostService.instance;

interface PostListModel {
    categoryName: string;
    pageIndex: number;
    pageSize: number;
    postList: [];
    postsCount: number;
    zzkSearchResult?: ZzkSearchResult;
}
