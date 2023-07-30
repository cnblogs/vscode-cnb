import fetch from '@/infra/fetch-client'
import { PostCategory, PostCategoryAddDto } from '@/model/post-category'
import { globalCtx } from '@/ctx/global-ctx'
import { URLSearchParams } from 'url'
import { AuthedReq } from '@/infra/http/authed-req'
import { consReqHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url'

let cache: Map<number, PostCategory[]> | null = null

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
        cache ??= new Map<number, PostCategory[]>()
        const map = cache
        const cachedCategories = map.get(parentId)
        if (cachedCategories && !shouldForceRefresh) return cachedCategories

        const para = consUrlPara(['parent', parentId <= 0 ? '' : `${parentId}`])
        const url = `${globalCtx.config.apiBaseUrl}/api/v2/blog-category-types/1/categories?${para}`
        try {
            const resp = await AuthedReq.get(url, consReqHeader())
            const { categories } = <{ categories: PostCategory[] }>JSON.parse(resp)
            map.set(parentId, categories)
            return categories
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`获取随笔分类失败: ${e}`)
            return []
        }
    }

    export async function find(id: number) {
        const para = consUrlPara(['parent', id <= 0 ? '' : id.toString()])
        const url = `${globalCtx.config.apiBaseUrl}/api/v2/blog-category-types/1/categories?${para}`

        try {
            const resp = await AuthedReq.get(url, consReqHeader())
            const { parent } = <{ parent?: PostCategory | null }>JSON.parse(resp)
            return Object.assign(new PostCategory(), parent)
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`查询随笔分类失败: ${e}`)
            return new PostCategory()
        }
    }

    export async function newCategory(dto: PostCategoryAddDto) {
        const url = `${globalCtx.config.apiBaseUrl}/api/category/blog/1`
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/json'])
        const body = JSON.stringify(dto)

        await AuthedReq.post(url, header, body)
    }

    export async function updateCategory(category: PostCategory) {
        const url = `${globalCtx.config.apiBaseUrl}/api/category/blog/${category.categoryId}`
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/json'])
        const body = JSON.stringify(category)

        await AuthedReq.put(url, header, body)
    }

    export async function deleteCategory(categoryId: number) {
        if (categoryId <= 0) throw Error('Invalid param categoryId')

        const url = `${globalCtx.config.apiBaseUrl}/api/category/blog/${categoryId}`
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/json'])

        try {
            await AuthedReq.del(url, header)
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`删除分类失败: ${e}`)
        }
    }

    export function clearCache() {
        cache = null
    }
}
