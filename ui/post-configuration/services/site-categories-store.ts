import { SiteCategories } from '@models/site-category'

export namespace siteCategoriesStore {
    let items: SiteCategories = []
    export const get = (): SiteCategories => items ?? []
    export const set = (value: SiteCategories) => (items = value ?? [])
}
