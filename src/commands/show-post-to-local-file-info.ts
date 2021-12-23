import { MessageOptions, Uri, window } from 'vscode';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { postCategoryService } from '../services/post-category.service';
import { PostFileMapManager } from '../services/post-file-map';
import { savePostFileToCnblogs } from './save-post';

/**
 * 博文与本地文件关联信息
 *
 * @param {(Uri | number)} input
 * @returns {*}  {Promise<void>}
 */
export const showPostToLocalFileInfo = async (input: Uri | number): Promise<void> => {
    let filePath: string | undefined;
    let postId: number | undefined;
    if (input instanceof Uri && input.scheme === 'file') {
        postId = PostFileMapManager.getPostId(input.fsPath);
        filePath = input.fsPath;
        if (!postId) {
            const options = ['现在去关联'];
            const selected = await window.showInformationMessage(
                '本地文件未关联博文',
                {
                    modal: true,
                    detail: filePath,
                } as MessageOptions,
                ...options
            );
            if (selected === options[0]) {
                await savePostFileToCnblogs(input);
            }
            return;
        }
    } else if (typeof input === 'number') {
        filePath = PostFileMapManager.getFilePath(input);
        postId = input;
    }

    if (!filePath || !postId || !(postId >= 0)) {
        return;
    }

    const post = (await blogPostService.fetchPostEditDto(postId)).post;
    let categories = await postCategoryService.fetchCategories();
    categories = categories.filter(x => post.categoryIds.includes(x.categoryId));
    const categoryDesc = categories.length > 0 ? `博文分类: ${categories.map(c => c.title).join(', ')}\n` : '';
    const tagsDesc = post.tags?.length ?? 0 > 0 ? `博文标签: ${post.tags?.join(', ')}\n` : '';
    const options = ['取消关联'];
    const selected = await window.showInformationMessage(
        `博文信息`,
        {
            modal: true,
            detail: `博文标题: ${post.title}\n本地文件: ${filePath}\n发布时间: ${post.datePublished}\n发布状态: ${
                post.isPublished ? '已发布' : '未发布'
            }\n访问权限: ${post.accessPermissionDesc}\n${categoryDesc}${tagsDesc}`.replace(/\n$/, ''),
        } as MessageOptions,
        ...options
    );
    if (selected === options[0]) {
        await PostFileMapManager.updateOrCreate(postId, '');
        AlertService.info(`博文 ${post.title} 已与 ${filePath} 取消关联`);
    }
};
