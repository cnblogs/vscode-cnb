import fs from 'fs'
import { ProgressLocation, window, Uri, workspace } from 'vscode'
import { PostCategory } from '@/model/post-category'
import { PostCategoryService } from '@/service/post/post-category'
import { inputPostCategory } from './input-post-category'
import { PostCategoryCfg } from '@/ctx/cfg/post-category'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { Alert } from '@/infra/alert'
import { PostCategoryTreeItem } from '@/tree-view/model/post-category-tree-item'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

export async function updatePostCatTreeView(arg?: PostCategory | PostCategoryTreeItem) {
    let category: PostCategory
    if (arg instanceof PostCategory) {
        category = arg
        void extTreeViews.postCategoriesList.reveal(arg)
    } else if (arg instanceof PostCategoryTreeItem) {
        category = arg.category
        void extTreeViews.postCategoriesList.reveal(arg)
    } else {
        return
    }

    const addDto = await inputPostCategory({
        title: '编辑博文分类',
        category,
    })
    if (addDto === undefined) return

    const updateDto = Object.assign(new PostCategory(), category, addDto)

    await window.withProgress(
        {
            title: `正在更新博文分类 - ${updateDto.title}`,
            location: ProgressLocation.Notification,
        },
        async p => {
            p.report({ increment: 10 })
            try {
                await PostCategoryService.update(updateDto)
                postCategoryDataProvider.refresh()
                // 如果选择了createLocalPostFileWithCategory模式且本地有该目录,则重命名该目录
                const workspaceUri = WorkspaceCfg.getWorkspaceUri()
                const shouldCreateLocalPostFileWithCategory = PostCategoryCfg.isCreateLocalPostFileWithCategory()
                const uri = Uri.joinPath(workspaceUri, category.title).fsPath
                const isFileExist = fs.existsSync(uri)
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
        }
    )
}
