import { MessageOptions, ProgressLocation, window } from 'vscode';
import { PostCategory } from '../../models/post-category';
import { postCategoryService } from '../../services/post-category.service';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';
import { inputPostCategory } from './input-post-category';
import { refreshPostCategoriesList } from './refresh-post-categories-list';

export const updatePostCategory = async (category?: PostCategory) => {
    if (!category) {
        return;
    }
    await extensionViews.postCategoriesList?.reveal(category);
    const addDto = await inputPostCategory({
        title: '编辑博文分类',
        category,
    });
    if (!addDto) {
        return;
    }
    const updateDto = Object.assign(new PostCategory(), category, addDto);
    if (!updateDto) {
        return;
    }

    await window.withProgress(
        {
            title: `正在更新博文分类 - ${updateDto.title}`,
            location: ProgressLocation.Notification,
        },
        async p => {
            p.report({ increment: 10 });
            try {
                await postCategoryService.updateCategory(updateDto);
                refreshPostCategoriesList();
            } catch (err) {
                void window.showErrorMessage('更新博文分类失败', {
                    detail: `服务器反回了错误, ${err instanceof Error ? err.message : JSON.stringify(err)}`,
                    modal: true,
                } as MessageOptions);
            } finally {
                p.report({ increment: 100 });
            }
        }
    );
};
