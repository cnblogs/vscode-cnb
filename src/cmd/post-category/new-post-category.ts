import { MessageOptions, ProgressLocation, window } from 'vscode'
import { PostCategoryService } from '@/service/post-category'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { inputPostCategory } from './input-post-category'
import { refreshPostCategoryList } from './refresh-post-category-list'
import { Alert } from '@/infra/alert'

export const newPostCategory = async () => {
    const input = await inputPostCategory({
        title: '新建分类',
    })
    if (!input) return

    await window.withProgress(
        {
            title: '正在新建博文分类',
            location: ProgressLocation.Notification,
        },
        async p => {
            p.report({
                increment: 50,
            })
            try {
                await PostCategoryService.newCategory(input)
                p.report({
                    increment: 90,
                })
                refreshPostCategoryList()
                const newCategory = (await PostCategoryService.listCategories()).find(x => x.title === input.title)
                if (newCategory) await extTreeViews.postCategoriesList.reveal(newCategory)
            } catch (err) {
                void Alert.err('新建博文分类时遇到了错误', {
                    modal: true,
                    detail: `服务器反回了错误\n${err instanceof Error ? err.message : JSON.stringify(err)}`,
                } as MessageOptions)
            } finally {
                p.report({
                    increment: 100,
                })
            }
        }
    )
}
