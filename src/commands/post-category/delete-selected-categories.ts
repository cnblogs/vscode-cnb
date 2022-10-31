import { MessageOptions, ProgressLocation, window } from 'vscode';
import { PostCategory } from '../../models/post-category';
import { postCategoryService } from '../../services/post-category.service';
import { PostCategoriesListTreeItem } from '../../tree-view-providers/models/categories-list-tree-item';
import { BaseMultiSelectablePostCategoryTreeViewCommandHandler } from './base-tree-view-command-handler';
import { refreshPostCategoriesList } from './refresh-post-categories-list';

export class DeletePostCategoriesHandler extends BaseMultiSelectablePostCategoryTreeViewCommandHandler {
    constructor(input: PostCategoriesListTreeItem) {
        super(input);
    }

    async handle(): Promise<void> {
        const {
            selections: { length },
        } = this;

        if (length <= 0 || !(await this.confirm())) return;

        await this.delete();
    }

    private delete() {
        const { selections: selectedCategories } = this;
        return window.withProgress(
            {
                title: '正在删除博文分类',
                location: ProgressLocation.Notification,
            },
            async p => {
                p.report({ increment: 10 });
                let idx = 0;
                const errs: [PostCategory, any][] = [];
                for (const category of selectedCategories) {
                    try {
                        const increment = Math.round(10 + idx / selectedCategories.length / 90);
                        p.report({ increment, message: `正在删除: 📂${category.title}` });
                        await postCategoryService.deleteCategory(category.categoryId);
                        idx++;
                    } catch (err) {
                        errs.push([category, err]);
                    }
                }

                p.report({ increment: 100 });
                if (errs.length > 0) {
                    await window.showErrorMessage('删除博文分类时发生了一些错误', {
                        detail: errs
                            .map(
                                err =>
                                    `${err[0].title} - ${
                                        err[1] instanceof Error ? err[1].message : JSON.stringify(err[1])
                                    }`
                            )
                            .join('\n'),
                    } as MessageOptions);
                }
                if (errs.length < selectedCategories.length) refreshPostCategoriesList();
            }
        );
    }

    private async confirm() {
        const options = ['确定'];
        const clicked = await window.showWarningMessage(
            '确定要删除这些博文分类吗',
            {
                detail: `${this.selections.map(x => `📂${x.title}`).join(', ')} 将被永久删除! 请谨慎操作!`,
                modal: true,
            } as MessageOptions,
            ...options
        );
        if (clicked === options[0]) return true;

        return false;
    }
}

export const handleDeletePostCategories = (arg: PostCategoriesListTreeItem) =>
    new DeletePostCategoriesHandler(arg).handle();
