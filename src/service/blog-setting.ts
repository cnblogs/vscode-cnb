import { BlogSetting, BlogSiteDto, BlogSiteExtendDto } from '@/model/blog-setting'
import { globalCtx } from '@/ctx/global-ctx'
import { AuthedReq } from '@/infra/http/authed-req'
import { consReqHeader } from '@/infra/http/infra/header'
import { Alert } from '@/infra/alert'

let cache: BlogSetting | null = null

export namespace BlogSettingService {
    export async function getBlogSetting(refresh = false) {
        if (cache != null && !refresh) return cache

        const url = `${globalCtx.config.apiBaseUrl}/api/settings`

        try {
            const resp = await AuthedReq.get(url, consReqHeader())
            const data = JSON.parse(resp) as { blogSite: BlogSiteDto; extend: BlogSiteExtendDto }
            const setting = new BlogSetting(data.blogSite, data.extend)
            cache ??= setting
            return setting
        } catch (e) {
            void Alert.err(`获取博客设置失败: ${<string>e}`)
            return cache
        }
    }
}
