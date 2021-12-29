import fetch from 'node-fetch';
import { BlogPost } from '../models/blog-post';
import { globalState } from './global-state';
import { PageModel } from '../models/page-model';
import { PostsListState } from '../models/posts-list-state';
import { accountService } from './account.service';
import { PostEditDto } from '../models/post-edit-dto';
import { PostUpdatedResponse } from '../models/post-updated-response';

const defaultPageSize = 30;
let newPostTemplate: PostEditDto;

export class BlogPostService {
    private static _instance = new BlogPostService();

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

    async fetchPostsList({ search = '', pageIndex = 1, pageSize = defaultPageSize }): Promise<PageModel<BlogPost>> {
        const s = new URLSearchParams([
            ['t', '1'],
            ['p', `${pageIndex}`],
            ['s', `${pageSize}`],
            ['search', search],
        ]);
        const response = await fetch(`${this._baseUrl}/api/posts/list?${s}`, {
            headers: [accountService.buildBearerAuthorizationHeader()],
            method: 'GET',
        });
        if (!response.ok) {
            throw Error(`request failed, ${response.status}, ${await response.text()}`);
        }
        const obj = <PagedBlogPostDto>await response.json();
        return new PageModel(
            obj.pageIndex,
            obj.pageSize,
            obj.postsCount,
            obj.postList.map(x => Object.assign(new BlogPost(), x))
        );
    }

    async fetchPostEditDto(postId: number): Promise<PostEditDto> {
        const response = await fetch(`${this._baseUrl}/api/posts/${postId}`, {
            headers: [accountService.buildBearerAuthorizationHeader()],
            method: 'GET',
        });
        if (!response.ok) {
            throw Error('failed to fetch postEditDto\n' + response.status + '\n' + (await response.text()));
        }
        const obj = (await response.json()) as any;
        return new PostEditDto(Object.assign(new BlogPost(), obj.blogPost), obj.myConfig);
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

    async updatePost(post: BlogPost): Promise<PostUpdatedResponse> {
        const response = await fetch(`${this._baseUrl}/api/posts`, {
            headers: [accountService.buildBearerAuthorizationHeader(), ['Content-Type', 'application/json']],
            method: 'POST',
            body: JSON.stringify(post),
        });
        if (!response.ok) {
            throw Error(
                `update post: response statue indicate failed\nstatus code: ${
                    response.status
                }\n response body: ${await response.text()}`
            );
        }
        return Object.assign(new PostUpdatedResponse(), await response.json());
    }

    async updatePostsListState(state: PostsListState | undefined | PageModel<BlogPost>) {
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

    async fetchPostEditDtoTemplate(): Promise<PostEditDto> {
        if (!newPostTemplate) {
            newPostTemplate = await this.fetchPostEditDto(-1);
        }

        return Object.assign({}, newPostTemplate, {
            post: Object.assign({}, newPostTemplate.post),
        } as PostEditDto);
    }
}

export const blogPostService = BlogPostService.instance;

interface PagedBlogPostDto {
    categoryName: string;
    pageIndex: number;
    pageSize: number;
    postList: [];
    postsCount: number;
}
