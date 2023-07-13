import { postCategoriesDataProvider } from '@/tree-view-providers/post-categories-tree-data-provider'

export const refreshPostCategoriesList = () => {
    postCategoriesDataProvider.refresh()
}
