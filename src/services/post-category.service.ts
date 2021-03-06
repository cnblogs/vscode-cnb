import fetch from 'node-fetch';
import { PostCategories, PostCategory, PostCategoryAddDto } from '../models/post-category';
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

    async newCategory(categoryAddDto: PostCategoryAddDto) {
        const res = await fetch(`${globalState.config.apiBaseUrl}/api/category/blog/1`, {
            method: 'POST',
            body: JSON.stringify(categoryAddDto),
            headers: [accountService.buildBearerAuthorizationHeader(), ['Content-Type', 'application/json']],
        });
        if (!res.ok) {
            throw Error(`${res.status}-${res.statusText}\n${await res.text()}`);
        }
    }

    async updateCategory(category: PostCategory) {
        const res = await fetch(`${globalState.config.apiBaseUrl}/api/category/blog/${category.categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(category),
            headers: [accountService.buildBearerAuthorizationHeader(), ['Content-Type', 'application/json']],
        });
        if (!res.ok) {
            throw Error(`${res.status}-${res.statusText}\n${await res.text()}`);
        }
    }

    async deleteCategory(categoryId: number) {
        if (categoryId <= 0) {
            throw Error('Invalid param categoryId');
        }
        const res = await fetch(`${globalState.config.apiBaseUrl}/api/category/blog/${categoryId}`, {
            method: 'DELETE',
            headers: [accountService.buildBearerAuthorizationHeader(), ['Content-Type', 'application/json']],
        });
        if (!res.ok) {
            throw Error(`${res.status}-${res.statusText}\n${await res.text()}`);
        }
    }

    clearCache() {
        this._cached = undefined;
    }
}

export const postCategoryService = PostCategoryService.instance;
