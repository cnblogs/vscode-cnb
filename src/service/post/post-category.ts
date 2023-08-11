import { PostCategory, PostCategoryAddDto } from '@/model/post-category'
import { globalCtx } from '@/ctx/global-ctx'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { SiteCategory } from '@/model/site-category'
import { AuthManager } from '@/auth/auth-manager'
import { PostCategoryReq } from '@/wasm'

let cache: Map<number, PostCategory[]> | null = null
let siteCategoryCache: SiteCategory[] | null = null

async function getAuthedPostCategoryReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new PostCategoryReq(token, isPatToken)
}

export namespace PostCategoryService {
    export async function listCategories(option: { forceRefresh?: boolean | null; parentId?: number }) {
        const parentId = option.parentId ?? -1
        const shouldForceRefresh = option.forceRefresh ?? false
        cache ??= new Map<number, PostCategory[]>()
        const map = cache
        const cachedCategories = map.get(parentId)
        if (cachedCategories && !shouldForceRefresh) return cachedCategories

        const para = consUrlPara(['parent', parentId <= 0 ? '' : `${parentId}`])
        const url = `${globalCtx.config.apiBaseUrl}/api/v2/blog-category-types/1/categories?${para}`
        try {
            const resp = await AuthedReq.get(url, consHeader())
            let { categories } = <{ categories: PostCategory[] }>JSON.parse(resp)
            categories = categories.map(x => Object.assign(new PostCategory(), x))
            map.set(parentId, categories)
            return categories
        } catch (e) {
            void Alert.err(`获取随笔分类失败: ${<string>e}`)
            return []
        }
    }

    export async function getAll() {
        const req = await getAuthedPostCategoryReq()
        try {
            const resp = await req.getAll()
            let { categories } = <{ categories: PostCategory[] }>JSON.parse(resp)
            categories = categories.map(x => Object.assign(new PostCategory(), x))
            return categories
        } catch (e) {
            void Alert.err(`查询随笔分类失败: ${<string>e}`)
            throw e
        }
    }

    export async function getOne(categoryId: number) {
        const req = await getAuthedPostCategoryReq()
        try {
            const resp = await req.getOne(categoryId)
            const { parent } = <{ parent: PostCategory | null }>JSON.parse(resp)
            return Object.assign(new PostCategory(), parent)
        } catch (e) {
            void Alert.err(`查询随笔分类失败: ${<string>e}`)
            throw e
        }
    }

    export async function newCategory(dto: PostCategoryAddDto) {
        const req = await getAuthedPostCategoryReq()
        const body = JSON.stringify(dto)
        try {
            await req.create(body)
        } catch (e) {
            void Alert.err(`创建分类失败: ${<string>e}`)
        }
    }

    export async function updateCategory(category: PostCategory) {
        const req = await getAuthedPostCategoryReq()
        const body = JSON.stringify(category)
        try {
            await req.update(category.categoryId, body)
        } catch (e) {
            void Alert.err(`更新分类失败: ${<string>e}`)
        }
    }

    export async function deleteCategory(categoryId: number) {
        const req = await getAuthedPostCategoryReq()
        try {
            await req.del(categoryId)
        } catch (e) {
            void Alert.err(`删除分类失败: ${<string>e}`)
        }
    }

    // TODO: consider remove this
    export function clearCache() {
        cache = null
    }

    export async function getSiteCategoryList(forceRefresh = false) {
        if (siteCategoryCache != null && !forceRefresh) return siteCategoryCache
        const req = await getAuthedPostCategoryReq()

        try {
            const resp = await req.getSiteCategoryList()
            siteCategoryCache = <SiteCategory[]>JSON.parse(resp)
        } catch (e) {
            void Alert.err(`获取随笔分类失败: ${<string>e}`)
        }

        return siteCategoryCache
    }
}
