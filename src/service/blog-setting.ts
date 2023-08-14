import { BlogSetting, BlogSiteDto, BlogSiteExtendDto } from '@/model/blog-setting'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'
import { Alert } from '@/infra/alert'
import { AppConst } from '@/ctx/app-const'

let cache: BlogSetting | null = null

export namespace BlogSettingService {
    export async function getBlogSetting(refresh = false) {
        if (cache != null && !refresh) return cache

        const url = `${AppConst.ApiBase.BLOG_BACKEND}/settings`

        try {
            const resp = await AuthedReq.get(url, consHeader())
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
