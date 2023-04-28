import fetch from '@/utils/fetch-client';
import { PostCategories, PostCategory, PostCategoryAddDto } from '../models/post-category';
import { globalContext } from './global-state';
import { URLSearchParams } from 'url';

export class PostCategoryService {
    private static _instance: PostCategoryService;

    private _cache?: Map<number, PostCategories>;

    private constructor() {}

    static get instance(): PostCategoryService {
        if (!this._instance) this._instance = new PostCategoryService();

        return this._instance;
    }

    async findCategories(ids: number[], { useCache = true } = {}): Promise<PostCategories> {
        ids = ids.filter(x => x > 0);
        if (ids.length <= 0) return [];

        const categories = await this.listCategories(!useCache);
        return categories.filter(({ categoryId }) => ids.includes(categoryId));
    }

    listCategories(): Promise<PostCategories>;
    listCategories({
        forceRefresh = false,
        parentId = -1,
    }: {
        forceRefresh?: boolean | null;
        parentId?: number;
    }): Promise<PostCategories>;
    listCategories(forceRefresh: boolean): Promise<PostCategories>;
    async listCategories(
        option: boolean | { forceRefresh?: boolean | null; parentId?: number } = {}
    ): Promise<PostCategories> {
        const parentId = typeof option === 'object' ? option.parentId ?? -1 : -1;
        const shouldForceRefresh =
            option === true || (typeof option === 'object' ? option.forceRefresh ?? false : false);
        const map = (this._cache ??= new Map<number, PostCategories>());
        const cachedCategories = map.get(parentId);
        if (cachedCategories && !shouldForceRefresh) return cachedCategories;

        const res = await fetch(
            `${globalContext.config.apiBaseUrl}/api/v2/blog-category-types/1/categories?${new URLSearchParams([
                ['parent', parentId <= 0 ? '' : `${parentId}`],
            ]).toString()}`
        );
        if (!res.ok) throw Error(`Failed to fetch post categories\n${res.status}\n${await res.text()}`);

        let { categories } = <{ parent?: PostCategory | null; categories: PostCategories }>await res.json();
        categories = categories.map(x => Object.assign(new PostCategory(), x));
        map.set(parentId, categories);
        return categories;
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
        this._cache = undefined;
    }
}

export const postCategoryService = PostCategoryService.instance;
