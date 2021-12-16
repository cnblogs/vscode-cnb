import { Uri, workspace, window, ProgressLocation } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { LocalDraftFile } from '../models/local-draft-file';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { postsDataProvider } from '../tree-view-providers/blog-posts-data-provider';
import { openPostInVscode } from './open-post-in-vscode';
import { openPostFile } from './open-post-file';

export const saveLocalDraftToCnblogs = async (localDraft: LocalDraftFile) => {
    if (!localDraft) {
        return;
    }
    // check format
    if (!['.md'].some(x => localDraft.fileExt === x)) {
        AlertService.warning('不受支持的文件格式! 暂时只支持markdown格式');
        return;
    }
    const content = await localDraft.readAllText();
    const editDto = await blogPostService.fetchPostEditDtoTemplate();
    const { post } = editDto;
    post.postBody = content;
    post.title = localDraft.fileNameWithoutExt;
    post.isMarkdown = true;
    await savePostToCnblogs(post, true);
    await PostFileMapManager.updateOrCreate(post.id, localDraft.filePath);
    postsDataProvider.fireTreeDataChangedEvent(undefined);
    await openPostFile(localDraft);
};

export const savePostToCnblogs = async (post: BlogPost, isNewPost = false) => {
    if (!post) {
        return;
    }
    let { id: postId } = post;
    const localFilePath = PostFileMapManager.getFilePath(postId);
    if (!isNewPost) {
        if (!localFilePath) {
            AlertService.warning('本地无该博文的编辑记录');
            return;
        }
        const updatedPostBody = new TextDecoder().decode(await workspace.fs.readFile(Uri.file(localFilePath)));
        post.postBody = updatedPostBody;
    }

    const activeEditor = window.visibleTextEditors.find(x => x.document.uri.fsPath === localFilePath);
    if (activeEditor) {
        await activeEditor.document.save();
    }
    if (!validatePost(post)) {
        return;
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
                let { id: postId } = await blogPostService.updatePost(post);
                if (!isNewPost) {
                    await openPostInVscode(postId);
                } else {
                    post.id = postId;
                }
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

const validatePost = (post: BlogPost): boolean => {
    if (!post.postBody) {
        AlertService.warning('文件内容为空!');
        return false;
    }

    return true;
};
