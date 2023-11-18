import { ProgressLocation, window } from 'vscode'
import { PostCat } from '@/model/post-cat'
import { PostCatService } from '@/service/post/post-cat'
import { inputPostCat } from './input-post-cat'
import { Alert } from '@/infra/alert'
import { PostCatTreeItem } from '@/tree-view/model/post-category-tree-item'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

export async function updatePostCatTreeView(arg?: PostCat | PostCatTreeItem) {
    let category: PostCat
    if (arg instanceof PostCat) {
        category = arg
        void extTreeViews.postCategoriesList.reveal(arg)
    } else if (arg instanceof PostCatTreeItem) {
        category = arg.category
        void extTreeViews.postCategoriesList.reveal(arg)
    } else {
        return
    }

    const addDto = await inputPostCat('编辑分类', category)
    if (addDto === undefined) return

    const updateDto = Object.assign(new PostCat(), category, addDto)

    const opt = {
        title: `正在更新分类 - ${updateDto.title}`,
        location: ProgressLocation.Notification,
    }
    await window.withProgress(opt, async p => {
        p.report({ increment: 10 })
        try {
            await PostCatService.update(updateDto)
            postCategoryDataProvider.refresh()
            p.report({ increment: 100 })
        } catch (e) {
            void Alert.err(`更新博文失败: ${<string>e}`)
            p.report({ increment: 100 })
        }
    })
}
