import { ProgressLocation, window } from 'vscode'
import { PostCatService } from '@/service/post/post-cat'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { inputPostCat } from './input-post-cat'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

export async function newPostCat() {
    const input = await inputPostCat('新建分类')
    if (input === undefined) return

    const opt = {
        title: '正在新建博文分类',
        location: ProgressLocation.Notification,
    }

    await window.withProgress(opt, async p => {
        p.report({
            increment: 30,
        })
        await PostCatService.create(input)
        p.report({
            increment: 70,
        })

        postCategoryDataProvider.refresh()

        const allCategory = await PostCatService.getAll()
        const newCategory = allCategory.find(x => x.title === input.title)
        if (newCategory !== undefined) await extTreeViews.postCategoriesList.reveal(newCategory)

        p.report({
            increment: 100,
        })
    })
}
