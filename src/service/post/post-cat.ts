import { PostCat, PostCatAddDto } from '@/model/post-cat'
import { Alert } from '@/infra/alert'
import { SiteCat } from '@/model/site-category'
import { AuthManager } from '@/auth/auth-manager'
import { PostCatReq, Token } from '@/wasm'
import { UserService } from '../user.service'

// TODO: need better cache impl
let siteCategoryCache: SiteCat[] | null = null

async function getAuthedPostCatReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new PostCatReq(new Token(token, isPatToken))
}

export namespace PostCatService {
    export async function getAll() {
        const req = await getAuthedPostCatReq()
        try {
            const resp = await req.getAll()
            const { categories } = <{ categories: PostCat[] }>JSON.parse(resp)
            if (categories == null) return []
            return categories
        } catch (e) {
            if (await UserService.hasBlog()) void Alert.err(`查询随笔分类失败: ${<string>e}`)
            throw e
        }
    }

    export async function create(dto: PostCatAddDto) {
        const req = await getAuthedPostCatReq()
        const body = JSON.stringify(dto)
        try {
            await req.create(body)
        } catch (e) {
            void Alert.err(`创建分类失败: ${<string>e}`)
        }
    }

    export async function update(category: PostCat) {
        const req = await getAuthedPostCatReq()
        const body = JSON.stringify(category)
        try {
            await req.update(category.categoryId, body)
        } catch (e) {
            void Alert.err(`更新分类失败: ${<string>e}`)
        }
    }

    export async function del(categoryId: number) {
        const req = await getAuthedPostCatReq()
        try {
            await req.del(categoryId)
        } catch (e) {
            void Alert.err(`删除分类失败: ${<string>e}`)
        }
    }

    export async function getSitePresetList(forceRefresh = false) {
        if (siteCategoryCache != null && !forceRefresh) return siteCategoryCache
        const req = await getAuthedPostCatReq()

        try {
            const resp = await req.getSitePresetList()
            siteCategoryCache = <SiteCat[]>JSON.parse(resp)
        } catch (e) {
            void Alert.err(`获取随笔分类失败: ${<string>e}`)
        }

        return siteCategoryCache
    }
}
