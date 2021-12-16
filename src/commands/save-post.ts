import { Uri, workspace, window, ProgressLocation } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { openPostInVscode } from './open-post-in-vscode';

export const savePostToCnblogs = async (arg: BlogPost) => {
    if (!arg) {
        return;
    }
    const editDto = await blogPostService.fetchPostEditDto(arg.id);
    const post = editDto.post;
    const postId = post.id;
    const localFilePath = PostFileMapManager.getFilePath(postId);
    if (!localFilePath) {
        AlertService.warning('本地无该博文的编辑记录');
        return;
    }
    const encoder = new TextDecoder();
    const updatedPostBody = encoder.decode(await workspace.fs.readFile(Uri.file(localFilePath)));
    post.postBody = updatedPostBody;
    const activeEditor = window.visibleTextEditors.find(x => x.document.uri.fsPath === localFilePath);
    if (activeEditor) {
        await activeEditor.document.save();
    }

    await window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: '正在保存博文',
            cancellable: false,
        },
        async progress => {
            progress.report({
                increment: 10,
            });
            let success = false;
            try {
                await blogPostService.updatePost(post);
                await openPostInVscode(postId);
                success = true;
            } catch (err) {
                progress.report({ message: '保存博文失败', increment: 50 });
                console.error(err);
            } finally {
                progress.report({ increment: 90 });
                success ? AlertService.info('保存博文成功') : AlertService.error('保存博文失败');
            }
        }
    );
};
