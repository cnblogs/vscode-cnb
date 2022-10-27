import fetch from 'node-fetch';
import { Post } from '../models/post';
import { globalState } from './global-state';
import { PageModel } from '../models/page-model';
import { PostsListState } from '../models/posts-list-state';
import { accountService } from './account.service';
import { PostEditDto } from '../models/post-edit-dto';
import { PostUpdatedResponse } from '../models/post-updated-response';
import { throwIfNotOkResponse } from '../utils/throw-if-not-ok-response';
import { IErrorResponse } from '../models/error-response';
import { AlertService } from './alert.service';
import { PostFileMapManager } from './post-file-map';
import { ZzkSearchResult } from '../models/zzk-search-result';

const defaultPageSize = 30;
let newPostTemplate: PostEditDto | undefined;

export class PostService {
    private static _instance = new PostService();

    protected get _baseUrl() {
        return globalState.config.apiBaseUrl;
    }

    static get instance() {
        return this._instance;
    }

    get postsListState(): PostsListState | undefined {
        return globalState.storage.get<PostsListState>('postsListState');
    }

    protected constructor() {}

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
        const response = await fetch(`${this._baseUrl}/api/posts/list?${s}`, {
            headers: [accountService.buildBearerAuthorizationHeader()],
            method: 'GET',
        });
        if (!response.ok) {
            throw Error(`request failed, ${response.status}, ${await response.text()}`);
        }
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
        const response = await fetch(`${this._baseUrl}/api/posts/${postId}`, {
            headers: [accountService.buildBearerAuthorizationHeader()],
            method: 'GET',
        });
        try {
            await throwIfNotOkResponse(response);
        } catch (ex) {
            const { statusCode, errors } = ex as IErrorResponse;
            if (!muteErrorNotification) {
                if (statusCode === 404) {
                    AlertService.error('博文不存在');
                    const postFilePath = PostFileMapManager.getFilePath(postId);
                    if (postFilePath) {
                        await PostFileMapManager.updateOrCreate(postId, '');
                    }
                } else {
                    AlertService.error(errors.join('\n'));
                }
            }
            return undefined;
        }
        const obj = (await response.json()) as any;
        return new PostEditDto(Object.assign(new Post(), obj.blogPost), obj.myConfig);
    }

    async deletePost(postId: number) {
        const res = await fetch(`${this._baseUrl}/api/posts/${postId}`, {
            method: 'DELETE',
            headers: [accountService.buildBearerAuthorizationHeader()],
        });
        if (!res.ok) {
            throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`);
        }
    }

    async deletePosts(postIds: number[]) {
        const s = new URLSearchParams(postIds.map(id => ['postIds', `${id}`]));
        const res = await fetch(`${this._baseUrl}/api/bulk-operation/post?${s}`, {
            method: 'DELETE',
            headers: [accountService.buildBearerAuthorizationHeader()],
        });
        if (!res.ok) {
            throw Error(`删除博文失败!\n${res.status}\n${await res.text()}`);
        }
    }

    async updatePost(post: Post): Promise<PostUpdatedResponse> {
        const response = await fetch(`${this._baseUrl}/api/posts`, {
            headers: [accountService.buildBearerAuthorizationHeader(), ['Content-Type', 'application/json']],
            method: 'POST',
            body: JSON.stringify(post),
        });
        await throwIfNotOkResponse(response);
        return Object.assign(new PostUpdatedResponse(), await response.json());
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
        await globalState.storage.update('postsListState', finalState);
    }

    async fetchPostEditDtoTemplate(): Promise<PostEditDto | undefined> {
        if (!newPostTemplate) {
            newPostTemplate = await this.fetchPostEditDto(-1);
        }

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
