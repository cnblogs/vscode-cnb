import { Uri } from 'vscode';
import { Post } from '../../models/post';
import { AlertService } from '../../services/alert.service';
import { postService } from '../../services/post.service';
import { PostFileMapManager } from '../../services/post-file-map';
import { revealPostsListItem } from '../../services/posts-list-view';
import { postConfigurationPanel } from '../../services/post-configuration-panel.service';
import fs from 'fs';
import { LocalDraft } from '../../services/local-draft.service';
import { saveFilePendingChanges } from '../../utils/save-file-pending-changes';
import { postsDataProvider } from '../../tree-view-providers/posts-data-provider';
import { PostTreeItem } from '../../tree-view-providers/models/post-tree-item';
import { postCategoriesDataProvider } from '../../tree-view-providers/post-categories-tree-data-provider';

export const modifyPostSettings = async (input: Post | PostTreeItem | Uri) => {
    let post: Post | undefined;
    let postId = -1;
    input = input instanceof PostTreeItem ? input.post : input;

    if (input instanceof Post) {
        post = input;
        postId = input.id;
    } else if (input instanceof Uri) {
        postId = PostFileMapManager.getPostId(input.fsPath) ?? -1;
        if (postId < 0) return AlertService.fileNotLinkedToPost(input);
    }

    if (!(postId >= 0)) return;

    if (post) await revealPostsListItem(post);

    const editDto = await postService.fetchPostEditDto(postId);
    if (!editDto) return;

    const postEditDto = editDto.post;
    const localFilePath = PostFileMapManager.getFilePath(postId);
    await postConfigurationPanel.open({
        panelTitle: '',
        breadcrumbs: ['更新博文设置', editDto.post.title],
        post: postEditDto,
        localFileUri: localFilePath ? Uri.file(localFilePath) : undefined,
        successCallback: ({ id }) => {
            AlertService.info('博文已更新');
            postsDataProvider.fireTreeDataChangedEvent(id);
            postCategoriesDataProvider.onPostUpdated({ refreshPosts: false, postIds: [id] });
        },
        beforeUpdate: async post => {
            if (localFilePath && fs.existsSync(localFilePath)) {
                await saveFilePendingChanges(localFilePath);
                const content = await new LocalDraft(localFilePath).readAllText();
                post.postBody = content;
            }
            return true;
        },
    });
};
