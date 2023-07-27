import fetch from '@/infra/fetch-client'
import { PostCategories, PostCategory, PostCategoryAddDto } from '@/model/post-category'
import { globalCtx } from '@/ctx/global-ctx'
import { URLSearchParams } from 'url'

let cache: Map<number, PostCategories> | null = null

export namespace PostCategoryService {
    export async function findCategories(ids: number[], { useCache = true } = {}) {
        ids = ids.filter(x => x > 0)
        if (ids.length <= 0) return []

        const categories = await listCategories(!useCache)
        return categories.filter(({ categoryId }) => ids.includes(categoryId))
    }

    export async function listCategories(option: boolean | { forceRefresh?: boolean | null; parentId?: number } = {}) {
        const parentId = typeof option === 'object' ? option.parentId ?? -1 : -1
        const shouldForceRefresh =
            option === true || (typeof option === 'object' ? option.forceRefresh ?? false : false)
        cache ??= new Map<number, PostCategories>()
        const map = cache
        const cachedCategories = map.get(parentId)
        if (cachedCategories && !shouldForceRefresh) return cachedCategories

        const res = await fetch(
            `${globalCtx.config.apiBaseUrl}/api/v2/blog-category-types/1/categories?${new URLSearchParams([
                ['parent', parentId <= 0 ? '' : `${parentId}`],
            ]).toString()}`
        )
        if (!res.ok) throw Error(`${res.status}\n${await res.text()}`)

        let { categories } = <{ parent?: PostCategory | null; categories: PostCategories }>await res.json()
        categories = categories.map(x => Object.assign(new PostCategory(), x))
        map.set(parentId, categories)
        return categories
    }

    export async function find(id: number) {
        const res = await fetch(
            `${globalCtx.config.apiBaseUrl}/api/v2/blog-category-types/1/categories?${new URLSearchParams([
                ['parent', id <= 0 ? '' : `${id}`],
            ]).toString()}`
        )
        const { parent } = <{ parent?: PostCategory | null; categories: PostCategories }>await res.json()

        return Object.assign(new PostCategory(), parent)
    }

    export async function newCategory(categoryAddDto: PostCategoryAddDto) {
        const res = await fetch(`${globalCtx.config.apiBaseUrl}/api/category/blog/1`, {
            method: 'POST',
            body: JSON.stringify(categoryAddDto),
            headers: [['Content-Type', 'application/json']],
        })
        if (!res.ok) throw Error(`${res.status}-${res.statusText}\n${await res.text()}`)
    }

    export async function updateCategory(category: PostCategory) {
        const res = await fetch(`${globalCtx.config.apiBaseUrl}/api/category/blog/${category.categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(category),
            headers: [['Content-Type', 'application/json']],
        })
        if (!res.ok) throw Error(`${res.status}-${res.statusText}\n${await res.text()}`)
    }

    export async function deleteCategory(categoryId: number) {
        if (categoryId <= 0) throw Error('Invalid param categoryId')

        const res = await fetch(`${globalCtx.config.apiBaseUrl}/api/category/blog/${categoryId}`, {
            method: 'DELETE',
            headers: [['Content-Type', 'application/json']],
        })
        if (!res.ok) throw Error(`${res.status}-${res.statusText}\n${await res.text()}`)
    }

    export function clearCache() {
        cache = null
    }
}
