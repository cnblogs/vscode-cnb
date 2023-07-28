import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

export const refreshPostCategoryList = () => {
    postCategoryDataProvider.refresh()
}
