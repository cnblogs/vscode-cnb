import { BlogSetting, BlogSiteDto, BlogSiteExtendDto } from '@/model/blog-setting'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'
import { Alert } from '@/infra/alert'
import { ExtConst } from '@/ctx/ext-const'

let cache: BlogSetting | null = null

export class BlogSettingService {
    static getBlogSetting = async (refresh = false) => {
        if (cache != null && !refresh) return cache

        const url = `${ExtConst.ApiBase.BLOG_BACKEND}/settings`

        try {
            const resp = await AuthedReq.get(url, consHeader())
            const data = JSON.parse(resp) as { blogSite: BlogSiteDto; extend: BlogSiteExtendDto }
            const setting = new BlogSetting(data.blogSite, data.extend)
            cache ??= setting
            return setting
        } catch (e) {
            void Alert.err(`获取博客设置失败: ${e as string}`)
            return cache
        }
    }
}
