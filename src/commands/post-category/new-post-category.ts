import { MessageOptions, ProgressLocation, window } from 'vscode'
import { postCategoryService } from '@/services/post-category.service'
import { extViews } from '@/tree-view-providers/tree-view-registration'
import { inputPostCategory } from './input-post-category'
import { refreshPostCategoriesList } from './refresh-post-categories-list'
import { AlertService } from '@/services/alert.service'

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
                await postCategoryService.newCategory(input)
                p.report({
                    increment: 90,
                })
                refreshPostCategoriesList()
                const newCategory = (await postCategoryService.listCategories()).find(x => x.title === input.title)
                if (newCategory) await extViews.postCategoriesList.reveal(newCategory)
            } catch (err) {
                void AlertService.err('新建博文分类时遇到了错误', {
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
