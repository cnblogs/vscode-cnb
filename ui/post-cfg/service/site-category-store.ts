import { SiteCategory } from '@/model/site-category'

export namespace siteCategoriesStore {
    let items: SiteCategory[] = []
    export const get = (): SiteCategory[] => items ?? []
    export const set = (value: SiteCategory[]) => (items = value ?? [])
}
