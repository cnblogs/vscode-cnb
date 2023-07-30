import { SiteCategory } from '@/model/site-category'
import { globalCtx } from '@/ctx/global-ctx'
import { AuthedReq } from '@/infra/http/authed-req'
import { consReqHeader } from '@/infra/http/infra/header'

let cached: SiteCategory[] | null = null

export namespace SiteCategoryService {
    export async function fetchAll(forceRefresh = false) {
        if (cached && !forceRefresh) return cached

        const url = `${globalCtx.config.apiBaseUrl}/api/category/site`
        try {
            const resp = await AuthedReq.get(url, consReqHeader())
            const list = <SiteCategory[]>JSON.parse(resp)
            cached = list
            return list
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.log(`获取随笔分类失败: ${e}`)
            return []
        }
    }
}
