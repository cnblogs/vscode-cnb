import { SiteCategories, SiteCategory } from '@/models/site-category'
import fetch from '@/utils/fetch-client'
import { globalCtx } from './global-ctx'

export namespace siteCategoryService {
    let cached: SiteCategories | null = null

    export const fetchAll = async (forceRefresh = false): Promise<SiteCategories> => {
        if (cached && !forceRefresh) return cached

        const response = await fetch(`${globalCtx.config.apiBaseUrl}/api/category/site`)
        if (!response.ok) throw Error(`Failed to fetch post categories\n${response.status}\n${await response.text()}`)

        const categories = <SiteCategories>await response.json()
        cached = categories.map(c => Object.assign(new SiteCategory(), c))
        return categories
    }
}
