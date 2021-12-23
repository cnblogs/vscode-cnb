import { Uri, workspace, window, ProgressLocation, MessageOptions } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { LocalDraftFile } from '../models/local-draft-file';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { postsDataProvider } from '../tree-view-providers/blog-posts-data-provider';
import { openPostInVscode } from './open-post-in-vscode';
import { openPostFile } from './open-post-file';
import { inputPostSettings } from '../utils/input-post-settings';
import { searchPostsByTitle } from '../services/search-post-by-title';
import * as path from 'path';

export const savePostFileToCnblogs = async (fileUri: Uri) => {
    if (!fileUri || fileUri.scheme !== 'file') {
        return;
    }
    const filePath = fileUri.fsPath;
    const fileName = path.basename(filePath);
    const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
    const postId = PostFileMapManager.getPostId(filePath);
    if (postId && postId >= 0) {
        await savePostToCnblogs((await blogPostService.fetchPostEditDto(postId)).post);
    } else {
        const options = [`新建博文`, `关联已有博文(可以根据标题搜索)`];
        const selected = await window.showInformationMessage(
            '保存博文到博客园',
            {
                modal: true,
                detail: `您可以新建一篇名为"${fileNameWithoutExt}"博文, 或将文件 "${filePath}" 关联到一篇已有博文并更新该博文; 若您选择后者, 您将通过标题搜索您博客园的博文并选择一个进行关联, 关联后将会更新该博文的标题和内容.`,
            } as MessageOptions,
            ...options
        );
        switch (selected) {
            case options[1]:
                {
                    const selectedPost = await searchPostsByTitle({
                        postTitle: path.basename(filePath, path.extname(filePath)),
                        quickPickTitle: '搜索要关联的博文',
                    });
                    if (selectedPost) {
                        PostFileMapManager.updateOrCreate(selectedPost.id, filePath);
                        const postEditDto = await blogPostService.fetchPostEditDto(selectedPost.id);
                        const fileContent = new TextDecoder().decode(await workspace.fs.readFile(fileUri));
                        if (!fileContent) {
                            await workspace.fs.writeFile(fileUri, new TextEncoder().encode(postEditDto.post.postBody));
                        }
                        await savePostToCnblogs(postEditDto.post);
                    }
                }
                break;
            case options[0]:
                await saveLocalDraftToCnblogs(
                    Object.assign(new LocalDraftFile(), {
                        filePath,
                    } as LocalDraftFile)
                );
                break;
        }
    }
};

export const saveLocalDraftToCnblogs = async (localDraft: LocalDraftFile) => {
    if (!localDraft) {
        return;
    }
    // check format
    if (!['.md'].some(x => localDraft.fileExt === x)) {
        AlertService.warning('不受支持的文件格式! 只支持markdown格式');
        return;
    }
    const content = await localDraft.readAllText();
    const editDto = await blogPostService.fetchPostEditDtoTemplate();
    const { post } = editDto;
    post.postBody = content;
    post.title = localDraft.fileNameWithoutExt;
    post.isMarkdown = true;
    const userInputPostConfig = await inputPostSettings(post.title, post);
    if (!userInputPostConfig) {
        AlertService.warning('操作已取消');
        return;
    }
    Object.assign(post, userInputPostConfig);

    if (!(await savePostToCnblogs(post, true))) {
        return;
    }
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
        post.title = path.basename(localFilePath, path.extname(localFilePath));
    }

    const activeEditor = window.visibleTextEditors.find(x => x.document.uri.fsPath === localFilePath);
    if (activeEditor) {
        await activeEditor.document.save();
    }
    if (!validatePost(post)) {
        return false;
    }

    return await window.withProgress(
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
                progress.report({ increment: 90 });
                AlertService.info('保存成功');
            } catch (err) {
                progress.report({ increment: 90 });
                AlertService.error(`保存失败\n${err instanceof Error ? err.message : JSON.stringify(err)}`);
                console.error(err);
            }
            return success;
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
