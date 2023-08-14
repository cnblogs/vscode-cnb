import { MessageOptions, ProgressLocation, window } from 'vscode'
import { PostCategory } from '@/model/post-category'
import { PostCategoryService } from '@/service/post/post-category'
import { PostCategoriesListTreeItem } from '@/tree-view/model/category-list-tree-item'
import { BaseMultiSelectablePostCategoryTreeViewCmdHandler } from './base-tree-view-cmd-handler'
import { Alert } from '@/infra/alert'
import { refreshPostCategoryList } from '@/cmd/post-category/refresh-post-category-list'

export class DeletePostCategoriesHandler extends BaseMultiSelectablePostCategoryTreeViewCmdHandler {
    constructor(input: PostCategoriesListTreeItem) {
        super(input)
    }

    async handle(): Promise<void> {
        const {
            selections: { length },
        } = this

        if (length <= 0 || !(await this.confirm())) return

        await this.delete()
    }

    private delete() {
        const { selections: selectedCategories } = this
        return window.withProgress(
            {
                title: '正在删除博文分类',
                location: ProgressLocation.Notification,
            },
            async p => {
                p.report({ increment: 10 })
                let idx = 0
                const errs: [PostCategory, any][] = []
                for (const category of selectedCategories) {
                    try {
                        const increment = Math.round(10 + idx / selectedCategories.length / 90)
                        p.report({ increment, message: `正在删除: 📂${category.title}` })
                        await PostCategoryService.del(category.categoryId)
                        idx++
                    } catch (err) {
                        errs.push([category, err])
                    }
                }

                p.report({ increment: 100 })
                if (errs.length > 0) {
                    await Alert.err('删除博文分类时发生错误', {
                        detail: errs
                            .map(
                                err =>
                                    `${err[0].title} - ${
                                        err[1] instanceof Error ? err[1].message : JSON.stringify(err[1])
                                    }`
                            )
                            .join('\n'),
                    } as MessageOptions)
                }
                if (errs.length < selectedCategories.length) refreshPostCategoryList()
            }
        )
    }

    private async confirm() {
        const options = ['确定']
        const titles = this.selections.map(x => x.title)
        const info = `分类 ${titles.join(', ')} 将被删除`
        const clicked = await Alert.warn(
            '确定要删除这些博文分类吗',
            {
                detail: info,
                modal: true,
            } as MessageOptions,
            ...options
        )

        return clicked === options[0]
    }
}

export const handleDeletePostCategories = (arg: PostCategoriesListTreeItem) =>
    new DeletePostCategoriesHandler(arg).handle()
