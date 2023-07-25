import fs from 'fs'
import { MessageOptions, ProgressLocation, window, Uri, workspace } from 'vscode'
import { PostCategory } from '@/models/post-category'
import { postCategoryService } from '@/services/post-category'
import { inputPostCategory } from './input-post-category'
import { refreshPostCategoriesList } from './refresh-post-categories-list'
import { Settings } from '@/services/settings'
import { BasePostCategoryTreeViewCmdHandler } from './base-tree-view-cmd-handler'

class UpdatePostCategoryTreeViewCmdHandler extends BasePostCategoryTreeViewCmdHandler {
    async handle(): Promise<void> {
        const category = this.parseInput()
        if (category == null) return

        const addDto = await inputPostCategory({
            title: '编辑博文分类',
            category,
        })
        if (!addDto) return

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
                    await postCategoryService.updateCategory(updateDto)
                    refreshPostCategoriesList()
                    // 如果选择了createLocalPostFileWithCategory模式且本地有该目录,则重命名该目录
                    const workspaceUri = Settings.workspaceUri
                    const shouldCreateLocalPostFileWithCategory = Settings.createLocalPostFileWithCategory
                    const uri = Uri.joinPath(workspaceUri, category.title).fsPath
                    const isFileExist = fs.existsSync(uri)
                    if (shouldCreateLocalPostFileWithCategory && isFileExist) {
                        const oldUri = Uri.joinPath(workspaceUri, category.title)
                        const newUri = Uri.joinPath(workspaceUri, addDto.title)
                        await workspace.fs.rename(oldUri, newUri)
                    }
                } catch (err) {
                    this.notifyFailed(err)
                } finally {
                    p.report({ increment: 100 })
                }
            }
        )
    }

    private notifyFailed(err: unknown) {
        window
            .showErrorMessage('更新博文分类失败', {
                detail: `服务器返回了错误, ${err instanceof Error ? err.message : JSON.stringify(err)}`,
                modal: true,
            } as MessageOptions)
            .then(undefined, undefined)
    }
}

export const handleUpdatePostCategory = (arg: unknown) => new UpdatePostCategoryTreeViewCmdHandler(arg).handle()
