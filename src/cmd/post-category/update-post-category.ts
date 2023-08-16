import fs from 'fs'
import { ProgressLocation, window, Uri, workspace } from 'vscode'
import { PostCategory } from '@/model/post-category'
import { PostCategoryService } from '@/service/post/post-category'
import { inputPostCategory } from './input-post-category'
import { refreshPostCategoryList } from './refresh-post-category-list'
import { BasePostCategoryTreeViewCmdHandler } from './base-tree-view-cmd-handler'
import { PostCategoryCfg } from '@/ctx/cfg/post-category'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { Alert } from '@/infra/alert'

class UpdatePostCategoryTreeViewCmdHandler extends BasePostCategoryTreeViewCmdHandler {
    async handle(): Promise<void> {
        const category = this.parseInput()
        if (category == null) return

        const addDto = await inputPostCategory({
            title: '编辑博文分类',
            category,
        })
        if (addDto === undefined) return

        const updateDto = Object.assign(new PostCategory(), category, addDto)
        if (!updateDto) return

        await window.withProgress(
            {
                title: `正在更新博文分类 - ${updateDto.title}`,
                location: ProgressLocation.Notification,
            },
            async p => {
                p.report({ increment: 10 })
                try {
                    await PostCategoryService.update(updateDto)
                    refreshPostCategoryList()
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
}

export const handleUpdatePostCategory = (arg: unknown) => new UpdatePostCategoryTreeViewCmdHandler(arg).handle()
