import path = require('path');
import { MessageOptions, Uri, window } from 'vscode';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { postCategoryService } from '../services/post-category.service';
import { PostFileMapManager } from '../services/post-file-map';
import { searchPostsByTitle } from '../services/search-post-by-title';
import { viewPostOnline } from './view-post-online';

/**
 * 本地文件所关联的博文信息
 *
 * @param {(Uri | number)} input
 * @returns {*}  {Promise<void>}
 */
export const showLocalFileToPostInfo = async (input: Uri | number): Promise<void> => {
    let filePath: string | undefined;
    let postId: number | undefined;
    if (input instanceof Uri && input.scheme === 'file') {
        postId = PostFileMapManager.getPostId(input.fsPath);
        filePath = input.fsPath;
        if (!postId) {
            const options = ['现在去关联'];
            const selected = await window.showInformationMessage(
                '本地文件尚未关联到博文',
                {
                    modal: true,
                    detail: filePath,
                } as MessageOptions,
                ...options
            );
            if (selected === options[0]) {
                const selectedPost = await searchPostsByTitle({
                    postTitle: path.basename(filePath, path.extname(filePath)),
                    quickPickTitle: '搜索要关联的博文',
                });
                if (selectedPost) {
                    await PostFileMapManager.updateOrCreate(selectedPost.id, filePath);
                    AlertService.info(`本地文件已与博文(${selectedPost.title}, Id: ${selectedPost.id})建立关联`);
                }
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
    const options = ['在线查看博文', '取消关联'];
    const postUrl = post.url.startsWith('//') ? `https:${post.url}` : post.url;
    const selected = await window.showInformationMessage(
        `关联博文 - ${post.title}(Id: ${post.id})`,
        {
            modal: true,
            detail: `🔗博文链接: ${postUrl}\n博文发布时间: ${post.datePublished}\n博文发布状态: ${
                post.isPublished ? '已发布' : '未发布'
            }\n博文访问权限: ${post.accessPermissionDesc}\n${categoryDesc}${tagsDesc}`.replace(/\n$/, ''),
        } as MessageOptions,
        ...options
    );
    if (selected === options[0]) {
        await viewPostOnline(post);
    } else if (selected === options[1]) {
        await PostFileMapManager.updateOrCreate(postId, '');
        AlertService.info(`博文 ${post.title} 已与 ${filePath} 取消关联`);
    }
};
