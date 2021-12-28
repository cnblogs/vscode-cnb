import { escapeRegExp } from 'lodash';
import path = require('path');
import { MessageOptions, ProgressLocation, Uri, window, workspace } from 'vscode';
import { BlogPost } from '../../models/blog-post';
import { blogPostService } from '../../services/blog-post.service';
import { PostFileMapManager } from '../../services/post-file-map';
import { postsDataProvider } from '../../tree-view-providers/blog-posts-data-provider';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';

const renameLinkedFile = async (post: BlogPost): Promise<void> => {
    const filePath = PostFileMapManager.getFilePath(post.id);

    if (!filePath) {
        return;
    }
    const fileUri = Uri.file(filePath);

    const options = ['是'];
    const input = await window.showInformationMessage(
        '重命名博文成功, 发现与博文关联的本地文件, 是否要重名本地文件',
        {
            modal: true,
        },
        ...options
    );
    if (input === options[0]) {
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName);
        const newFilePath = filePath.replace(new RegExp(`${escapeRegExp(fileName)}$`), `${post.title}${ext}`);
        await workspace.fs.rename(fileUri, Uri.file(newFilePath));
        await PostFileMapManager.updateOrCreate(post.id, newFilePath);
        postsDataProvider.fireTreeDataChangedEvent(post);
    }
};

export const renamePost = async (post: BlogPost) => {
    if (!post) {
        return;
    }

    const view = extensionViews.postsList!;
    await view.reveal(post);

    const input = await window.showInputBox({
        title: '请输入新的博文标题',
        validateInput: v => {
            return v ? undefined : '请输入一个标题';
        },
    });

    if (!input) {
        return;
    }

    const success = await window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: '正在更新博文',
        },
        async p => {
            p.report({ increment: 10 });
            const editDto = await blogPostService.fetchPostEditDto(post.id);
            p.report({ increment: 60 });

            const editingPost = editDto.post;
            editingPost.title = input;
            let success = false;
            try {
                await blogPostService.updatePost(editingPost);
                post.title = input;
                postsDataProvider.fireTreeDataChangedEvent(post);
                success = true;
            } catch (err) {
                window.showInformationMessage('更新博文失败', {
                    modal: true,
                    detail: err instanceof Error ? err.message : '服务器返回了异常',
                } as MessageOptions);
            } finally {
                p.report({ increment: 100 });
            }

            return success;
        }
    );

    if (success) {
        await renameLinkedFile(post);
    }
};
