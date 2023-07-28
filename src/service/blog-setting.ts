import fetch from '@/infra/fetch-client'
import { BlogSetting, BlogSiteDto, BlogSiteExtendDto } from '@/model/blog-setting'
import { globalCtx } from '@/ctx/global-ctx'

let settingCache: BlogSetting | null = null

export namespace BlogSettingService {
    export async function getBlogSetting(refresh = false) {
        if (settingCache != null && !refresh) return settingCache

        const url = `${globalCtx.config.apiBaseUrl}/api/settings`
        const res = await fetch(url)
        if (!res.ok) throw Error(`Failed to request ${url}, statusCode: ${res.status}, detail: ${await res.text()}`)

        const data = (await res.json()) as { blogSite: BlogSiteDto; extend: BlogSiteExtendDto }

        settingCache ??= new BlogSetting(data.blogSite, data.extend)

        return settingCache
    }
}
