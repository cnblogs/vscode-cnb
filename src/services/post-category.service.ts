import fetch from 'node-fetch';
import { PostCategories, PostCategory } from '../models/post-category';
import { accountService } from './account.service';
import { globalState } from './global-state';

export class PostCategoryService {
    private static _instance: PostCategoryService;
    static get instance(): PostCategoryService {
        if (!this._instance) {
            this._instance = new PostCategoryService();
        }

        return this._instance;
    }

    private _cached?: PostCategories;

    private constructor() {}

    async fetchCategories(forceRefresh = false): Promise<PostCategories> {
        if (this._cached && !forceRefresh) {
            return this._cached;
        }
        const res = await fetch(`${globalState.config.apiBaseUrl}/api/category/blog/1/edit`, {
            headers: [accountService.buildBearerAuthorizationHeader()],
        });
        if (!res.ok) {
            throw Error(`Failed to fetch post categories\n${res.status}\n${await res.text()}`);
        }
        const categories = <PostCategories>await res.json();
        this._cached = categories.map(x => Object.assign(new PostCategory(), x));
        return this._cached;
    }
}

export const postCategoryService = PostCategoryService.instance;
