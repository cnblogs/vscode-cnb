import { PostCategory, PostCategoryAddDto } from '@/model/post-category'
import { Alert } from '@/infra/alert'
import { SiteCategory } from '@/model/site-category'
import { AuthManager } from '@/auth/auth-manager'
import { PostCategoryReq } from '@/wasm'

// TODO: need better cache impl
let siteCategoryCache: SiteCategory[] | null = null

async function getAuthedPostCategoryReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new PostCategoryReq(token, isPatToken)
}

export namespace PostCategoryService {
    export async function getAll() {
        const req = await getAuthedPostCategoryReq()
        try {
            const resp = await req.getAll()
            const { categories } = <{ categories: PostCategory[] }>JSON.parse(resp)
            return categories.map(x => Object.assign(new PostCategory(), x))
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

    export async function getAllUnder(parentId: number) {
        const req = await getAuthedPostCategoryReq()
        try {
            const resp = await req.getOne(parentId)
            const { categories } = <{ categories: PostCategory[] }>JSON.parse(resp)
            return categories.map(x => Object.assign(new PostCategory(), x))
        } catch (e) {
            void Alert.err(`查询随笔分类失败: ${<string>e}`)
            throw e
        }
    }

    export async function create(dto: PostCategoryAddDto) {
        const req = await getAuthedPostCategoryReq()
        const body = JSON.stringify(dto)
        try {
            await req.create(body)
        } catch (e) {
            void Alert.err(`创建分类失败: ${<string>e}`)
        }
    }

    export async function update(category: PostCategory) {
        const req = await getAuthedPostCategoryReq()
        const body = JSON.stringify(category)
        try {
            await req.update(category.categoryId, body)
        } catch (e) {
            void Alert.err(`更新分类失败: ${<string>e}`)
        }
    }

    export async function del(categoryId: number) {
        const req = await getAuthedPostCategoryReq()
        try {
            await req.del(categoryId)
        } catch (e) {
            void Alert.err(`删除分类失败: ${<string>e}`)
        }
    }

    export async function getSitePresetList(forceRefresh = false) {
        if (siteCategoryCache != null && !forceRefresh) return siteCategoryCache
        const req = await getAuthedPostCategoryReq()

        try {
            const resp = await req.getSitePresetList()
            siteCategoryCache = <SiteCategory[]>JSON.parse(resp)
        } catch (e) {
            void Alert.err(`获取随笔分类失败: ${<string>e}`)
        }

        return siteCategoryCache
    }
}
