import { Uri, workspace, window, ProgressLocation, MessageOptions } from 'vscode';
import { Post } from '../../models/post';
import { LocalDraft } from '../../services/local-draft.service';
import { AlertService } from '../../services/alert.service';
import { postService } from '../../services/post.service';
import { PostFileMapManager } from '../../services/post-file-map';
import { postsDataProvider } from '../../tree-view-providers/posts-data-provider';
import { openPostInVscode } from './open-post-in-vscode';
import { openPostFile } from './open-post-file';
import { searchPostsByTitle } from '../../services/search-post-by-title';
import * as path from 'path';
import { refreshPostsList } from './refresh-posts-list';
import { PostEditDto } from '../../models/post-edit-dto';
import { PostTitleSanitizer } from '../../services/post-title-sanitizer.service';
import { postConfigurationPanel } from '../../services/post-configuration-panel.service';
import { saveFilePendingChanges } from '../../utils/save-file-pending-changes';
import { extractImages } from '../extract-images';
import { Settings } from '../../services/settings.service';
import { PostTreeItem } from '../../tree-view-providers/models/post-tree-item';

const parseFileUri = async (fileUri: Uri | undefined): Promise<Uri | undefined> => {
    if (fileUri && fileUri.scheme !== 'file') {
        fileUri = undefined;
    } else if (!fileUri) {
        const { activeTextEditor } = window;
        if (activeTextEditor) {
            const { document } = activeTextEditor;
            if (document.languageId === 'markdown' && !document.isUntitled) {
                await document.save();
                fileUri = document.uri;
            }
        }
    }

    return fileUri;
};

export const savePostFileToCnblogs = async (fileUri: Uri | undefined) => {
    fileUri = await parseFileUri(fileUri);
    if (!fileUri) return;

    const { fsPath: filePath } = fileUri;
    const postId = PostFileMapManager.getPostId(filePath);
    if (postId && postId >= 0) {
        await savePostToCnblogs(await postService.fetchPostEditDto(postId));
    } else {
        const options = [`新建博文`, `关联已有博文`];
        const selected = await window.showInformationMessage(
            '本地文件尚未关联到博客园博文',
            {
                modal: true,
                detail: `您可以选择新建一篇博文或将本地文件关联到一篇博客园博文(您可以根据标题搜索您在博客园博文)`,
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
                        await PostFileMapManager.updateOrCreate(selectedPost.id, filePath);
                        const postEditDto = await postService.fetchPostEditDto(selectedPost.id);
                        if (postEditDto) {
                            const fileContent = new TextDecoder().decode(await workspace.fs.readFile(fileUri));
                            if (!fileContent) {
                                await workspace.fs.writeFile(
                                    fileUri,
                                    new TextEncoder().encode(postEditDto.post.postBody)
                                );
                            }
                            await savePostToCnblogs(postEditDto.post);
                        }
                    }
                }
                break;
            case options[0]:
                await saveLocalDraftToCnblogs(new LocalDraft(filePath));
                break;
        }
    }
};

export const saveLocalDraftToCnblogs = async (localDraft: LocalDraft) => {
    if (!localDraft) return;

    // check format
    if (!['.md'].some(x => localDraft.fileExt === x)) {
        AlertService.warning('不受支持的文件格式! 只支持markdown格式');
        return;
    }
    const editDto = await postService.fetchPostEditDtoTemplate();
    if (!editDto) return;

    const { post } = editDto;
    post.title = localDraft.fileNameWithoutExt;
    post.isMarkdown = true;
    post.categoryIds ??= [];
    void postConfigurationPanel.open({
        panelTitle: '',
        breadcrumbs: ['新建博文', '博文设置', post.title],
        post,
        successCallback: async savedPost => {
            await refreshPostsList();
            await openPostFile(localDraft);
            if (Settings.automaticallyExtractImagesType)
                await extractImages(localDraft.filePathUri, Settings.automaticallyExtractImagesType);

            await PostFileMapManager.updateOrCreate(savedPost.id, localDraft.filePath);
            await openPostFile(localDraft);
            postsDataProvider.fireTreeDataChangedEvent(undefined);
            AlertService.info('博文已创建');
        },
        beforeUpdate: async (postToSave, panel) => {
            await saveFilePendingChanges(localDraft.filePath);
            // 本地文件已经被删除了
            if (!localDraft.exist && panel) {
                AlertService.warning('本地文件已删除, 无法新建博文');
                return false;
            }
            const content = await localDraft.readAllText();
            postToSave.postBody = content;
            return true;
        },
    });
};

export const savePostToCnblogs = async (input: Post | PostTreeItem | PostEditDto | undefined, isNewPost = false) => {
    input = input instanceof PostTreeItem ? input.post : input;
    const post =
        input instanceof PostEditDto
            ? input.post
            : input
            ? (await postService.fetchPostEditDto(input.id))?.post
            : undefined;
    if (!post) return;

    const { id: postId } = post;
    const localFilePath = PostFileMapManager.getFilePath(postId);
    await saveFilePendingChanges(localFilePath);
    if (!isNewPost) {
        if (!localFilePath) {
            AlertService.warning('本地无该博文的编辑记录');
            return;
        }
        const updatedPostBody = new TextDecoder().decode(await workspace.fs.readFile(Uri.file(localFilePath)));
        post.postBody = updatedPostBody;
        post.title = await PostTitleSanitizer.unSanitize(post);
    }

    if (!validatePost(post)) return false;

    return window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: '正在保存博文',
            cancellable: false,
        },
        async progress => {
            progress.report({
                increment: 10,
            });
            let hasSaved = false;
            try {
                if (Settings.automaticallyExtractImagesType && localFilePath)
                    await extractImages(Uri.file(localFilePath), Settings.automaticallyExtractImagesType);

                const { id: postId } = await postService.updatePost(post);
                if (!isNewPost) await openPostInVscode(postId);
                else post.id = postId;

                hasSaved = true;
                progress.report({ increment: 100 });
                AlertService.info('保存成功');
                await refreshPostsList();
            } catch (err) {
                progress.report({ increment: 100 });
                AlertService.error(`保存失败\n${err instanceof Error ? err.message : JSON.stringify(err)}`);
                console.error(err);
            }
            return hasSaved;
        }
    );
};

const validatePost = (post: Post): boolean => {
    if (!post.postBody) {
        AlertService.warning('文件内容为空!');
        return false;
    }

    return true;
};
