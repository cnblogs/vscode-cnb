import { ProgressLocation, window } from 'vscode'
import { PostCategoryService } from '@/service/post/post-category'
import { Alert } from '@/infra/alert'
import { PostCategory } from '@/model/post-category'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { PostCategoryTreeItem } from '@/tree-view/model/post-category-tree-item'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

export async function delSelectedCat(input?: PostCategoryTreeItem | PostCategory) {
    const view = extTreeViews.postCategoriesList
    const categories =
        view.selection
            .map(x => (x instanceof PostCategoryTreeItem ? x.category : x instanceof PostCategory ? x : null))
            .filter((x): x is PostCategory => x != null) ?? []

    let inputCat: PostCategory | null = null
    if (input instanceof PostCategoryTreeItem) inputCat = input.category
    else if (input instanceof PostCategory) inputCat = input

    if (inputCat === null) return
    if (categories.find(cat => cat.categoryId === inputCat?.categoryId) === undefined) categories.unshift(inputCat)

    const selections = categories

    if (selections.length <= 0) return

    const titles = selections.map(x => x.title)
    const answer = await Alert.warn(
        '确定要删除这些博文分类吗',
        {
            detail: `分类 ${titles.join(', ')} 将被删除`,
            modal: true,
        },
        '确定'
    )

    if (answer !== '确定') return

    return window.withProgress(
        {
            title: '正在删除博文分类',
            location: ProgressLocation.Notification,
        },
        async p => {
            p.report({ increment: 10 })
            let idx = 0
            for (const category of selections) {
                try {
                    const increment = Math.round(10 + idx / selections.length / 90)
                    p.report({ increment, message: `正在删除: 📂${category.title}` })
                    await PostCategoryService.del(category.categoryId)
                    idx++
                } catch (e) {
                    void Alert.err(`删除失败: ${<string>e}`)
                }
            }

            p.report({ increment: 100 })
            postCategoryDataProvider.refresh()
        }
    )
}
