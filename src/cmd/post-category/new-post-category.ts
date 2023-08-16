import { ProgressLocation, window } from 'vscode'
import { PostCategoryService } from '@/service/post/post-category'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { inputPostCategory } from './input-post-category'
import { refreshPostCategoryList } from './refresh-post-category-list'

export const newPostCategory = async () => {
    const input = await inputPostCategory({
        title: '新建分类',
    })
    if (input === undefined) return

    const opt = {
        title: '正在新建博文分类',
        location: ProgressLocation.Notification,
    }

    await window.withProgress(opt, async p => {
        p.report({
            increment: 30,
        })
        await PostCategoryService.create(input)
        p.report({
            increment: 70,
        })

        refreshPostCategoryList()

        const allCategory = await PostCategoryService.getAll()
        const newCategory = allCategory.find(x => x.title === input.title)
        if (newCategory !== undefined) await extTreeViews.postCategoriesList.reveal(newCategory)

        p.report({
            increment: 100,
        })
    })
}
