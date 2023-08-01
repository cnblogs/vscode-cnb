import { SiteCategory } from '@/model/site-category'
import { globalCtx } from '@/ctx/global-ctx'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'

let cached: SiteCategory[] | null = null

export namespace SiteCategoryService {
    export async function fetchAll(forceRefresh = false) {
        if (cached && !forceRefresh) return cached

        const url = `${globalCtx.config.apiBaseUrl}/api/category/site`
        try {
            const resp = await AuthedReq.get(url, consHeader())
            const list = <SiteCategory[]>JSON.parse(resp)
            cached = list
            return list
        } catch (e) {
            console.log(`获取随笔分类失败: ${<string>e}`)
            return []
        }
    }
}
