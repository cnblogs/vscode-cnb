import fetch from '@/utils/fetch-client'
import { BlogSettings, BlogSiteDto, BlogSiteExtendDto } from '@/models/blog-settings'
import { globalCtx } from './global-ctx'

let settingCache: BlogSettings | null = null

export namespace BlogSettingsService {
    export async function getBlogSettings(refresh = false) {
        if (settingCache != null && !refresh) return settingCache

        const url = `${globalCtx.config.apiBaseUrl}/api/settings`
        const res = await fetch(url)
        if (!res.ok) throw Error(`Failed to request ${url}, statusCode: ${res.status}, detail: ${await res.text()}`)

        const data = (await res.json()) as { blogSite: BlogSiteDto; extend: BlogSiteExtendDto }

        settingCache ??= new BlogSettings(data.blogSite, data.extend)

        return settingCache
    }
}
