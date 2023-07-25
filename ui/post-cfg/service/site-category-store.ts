import { SiteCategories } from '../../../src/model/site-category'

export namespace siteCategoriesStore {
    let items: SiteCategories = []
    export const get = (): SiteCategories => items ?? []
    export const set = (value: SiteCategories) => (items = value ?? [])
}
