import { Uri, workspace, window } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { openPostInVscode } from './open-post-in-vscode';

export const savePost = async (arg: BlogPost) => {
    if (!arg) {
        return;
    }
    const editDto = await blogPostService.fetchPostEditDto(arg.id);
    const post = editDto.post;
    const postId = post.id;
    const localFilePath = PostFileMapManager.getFilePath(postId);
    if (!localFilePath) {
        AlertService.warning('本地该博文的编辑记录');
        return;
    }
    const encoder = new TextDecoder();
    const updatedPostBody = encoder.decode(await workspace.fs.readFile(Uri.file(localFilePath)));
    post.postBody = updatedPostBody;
    const activeEditor = window.visibleTextEditors.find(x => x.document.uri.fsPath === localFilePath);
    if (activeEditor) {
        await activeEditor.document.save();
    }

    try {
        await blogPostService.updatePost(post);
        AlertService.info('保存博文成功');
        await openPostInVscode(postId);
    } catch (err) {
        AlertService.error('保存博文失败\n' + (err instanceof Error ? err.message : ''));
        console.error(err);
    }
};
