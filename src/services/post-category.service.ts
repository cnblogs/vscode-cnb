import fetch from '@/utils/fetch-client';
import { PostCategories, PostCategory, PostCategoryAddDto } from '../models/post-category';
import { globalContext } from './global-state';

export class PostCategoryService {
    private static _instance: PostCategoryService;

    private _cached?: PostCategories;

    private constructor() {}

    static get instance(): PostCategoryService {
        if (!this._instance) this._instance = new PostCategoryService();

        return this._instance;
    }

    async findCategories(ids: number[], { useCache = true } = {}): Promise<PostCategories> {
        ids = ids.filter(x => x > 0);
        if (ids.length <= 0) return [];

        const categories = await this.fetchCategories(!useCache);
        return categories.filter(({ categoryId }) => ids.includes(categoryId));
    }

    async fetchCategories(forceRefresh = false): Promise<PostCategories> {
        if (this._cached && !forceRefresh) return this._cached;

        const res = await fetch(`${globalContext.config.apiBaseUrl}/api/category/blog/1/edit`);
        if (!res.ok) throw Error(`Failed to fetch post categories\n${res.status}\n${await res.text()}`);

        const categories = <PostCategories>await res.json();
        this._cached = categories.map(x => Object.assign(new PostCategory(), x));
        return this._cached;
    }

    async newCategory(categoryAddDto: PostCategoryAddDto) {
        const res = await fetch(`${globalContext.config.apiBaseUrl}/api/category/blog/1`, {
            method: 'POST',
            body: JSON.stringify(categoryAddDto),
            headers: [['Content-Type', 'application/json']],
        });
        if (!res.ok) throw Error(`${res.status}-${res.statusText}\n${await res.text()}`);
    }

    async updateCategory(category: PostCategory) {
        const res = await fetch(`${globalContext.config.apiBaseUrl}/api/category/blog/${category.categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(category),
            headers: [['Content-Type', 'application/json']],
        });
        if (!res.ok) throw Error(`${res.status}-${res.statusText}\n${await res.text()}`);
    }

    async deleteCategory(categoryId: number) {
        if (categoryId <= 0) throw Error('Invalid param categoryId');

        const res = await fetch(`${globalContext.config.apiBaseUrl}/api/category/blog/${categoryId}`, {
            method: 'DELETE',
            headers: [['Content-Type', 'application/json']],
        });
        if (!res.ok) throw Error(`${res.status}-${res.statusText}\n${await res.text()}`);
    }

    clearCache() {
        this._cached = undefined;
    }
}

export const postCategoryService = PostCategoryService.instance;
