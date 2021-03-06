import { Uri } from 'vscode';
import { Post } from '../../models/post';
import { AlertService } from '../../services/alert.service';
import { postService } from '../../services/post.service';
import { PostFileMapManager } from '../../services/post-file-map';
import { revealPostsListItem } from '../../services/posts-list-view';
import { postConfigurationPanel } from '../../services/post-configuration-panel.service';
import path from 'path';
import fs from 'fs';
import { LocalFileService } from '../../services/local-draft.service';
import { saveFilePendingChanges } from '../../utils/save-file-pending-changes';

export const modifyPostSettings = async (input: Post | Uri) => {
    let post: Post | undefined;
    let postId = -1;
    if (input instanceof Post) {
        post = input;
        postId = input.id;
    } else if (input instanceof Uri) {
        postId = PostFileMapManager.getPostId(input.fsPath) ?? -1;
        const filename = path.basename(input.fsPath, path.extname(input.fsPath));
        if (postId < 0) {
            AlertService.warning(`本地文件 "${filename}" 未关联博客园博文`);
            return;
        }
    }

    if (!(postId >= 0)) {
        return;
    }

    if (post) {
        await revealPostsListItem(post);
    }
    const editDto = await postService.fetchPostEditDto(postId);
    if (!editDto) {
        return;
    }
    const postEditDto = editDto.post;
    const localFilePath = PostFileMapManager.getFilePath(postId);
    await postConfigurationPanel.open({
        panelTitle: '',
        breadcrumbs: ['更新博文设置', editDto.post.title],
        post: postEditDto,
        localFileUri: localFilePath ? Uri.file(localFilePath) : undefined,
        successCallback: () => {
            AlertService.info('博文已更新');
        },
        beforeUpdate: async post => {
            if (localFilePath && fs.existsSync(localFilePath)) {
                await saveFilePendingChanges(localFilePath);
                const content = await new LocalFileService(localFilePath).readAllText();
                post.postBody = content;
            }
            return true;
        },
    });
};
