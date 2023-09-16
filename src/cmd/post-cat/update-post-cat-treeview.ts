import { ProgressLocation, window, Uri, workspace } from 'vscode'
import { PostCat } from '@/model/post-cat'
import { PostCatService } from '@/service/post/post-cat'
import { inputPostCat } from './input-post-cat'
import { PostCatCfg } from '@/ctx/cfg/post-cat'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { Alert } from '@/infra/alert'
import { PostCatTreeItem } from '@/tree-view/model/post-category-tree-item'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { fsUtil } from '@/infra/fs/fsUtil'

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
            // 如果选择了createLocalPostFileWithCategory模式且本地有该目录,则重命名该目录
            const workspaceUri = WorkspaceCfg.getWorkspaceUri()
            const shouldCreateLocalPostFileWithCategory = PostCatCfg.isCreateLocalPostFileWithCategory()
            const path = Uri.joinPath(workspaceUri, category.title).fsPath
            const isFileExist = await fsUtil.exists(path)
            if (shouldCreateLocalPostFileWithCategory && isFileExist) {
                const oldUri = Uri.joinPath(workspaceUri, category.title)
                const newUri = Uri.joinPath(workspaceUri, addDto.title)
                await workspace.fs.rename(oldUri, newUri)
            }
            p.report({ increment: 100 })
        } catch (e) {
            void Alert.err(`更新博文失败: ${<string>e}`)
            p.report({ increment: 100 })
        }
    })
}
