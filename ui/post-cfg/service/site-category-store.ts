import { SiteCategory } from '@/model/site-category'

let items: SiteCategory[] = []

export namespace SiteCategoryStore {
    export const get = () => items

    export function set(value: SiteCategory[]) {
        items = value
    }
}
