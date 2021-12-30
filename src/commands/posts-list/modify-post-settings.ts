import { Uri } from 'vscode';
import { Post } from '../../models/post';
import { AlertService } from '../../services/alert.service';
import { postService } from '../../services/post.service';
import { PostFileMapManager } from '../../services/post-file-map';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';
import { inputPostSettings } from '../../utils/input-post-settings';

export const modifyPostSettings = async (input: Post | Uri) => {
    let post: Post | undefined;
    let postId = -1;
    if (input instanceof Post) {
        post = input;
        postId = input.id;
    } else if (input instanceof Uri) {
        postId = PostFileMapManager.getPostId(input.fsPath) ?? -1;
        if (postId < 0) {
            AlertService.warning('本地文件尚未关联到博文');
            return;
        }
    }

    if (!(postId >= 0)) {
        return;
    }

    if (post) {
        await extensionViews.postsList?.reveal(post);
    }
    const editDto = await postService.fetchPostEditDto(postId);
    const postEditDto = editDto.post;
    const inputSettings = await inputPostSettings(postEditDto.title, postEditDto);
    if (!inputSettings) {
        return;
    }

    Object.assign(postEditDto, inputSettings);
    try {
        await postService.updatePost(postEditDto);
        AlertService.info('更新博文设置成功');
    } catch (err) {
        AlertService.error(err instanceof Error ? err.message : `更新博文设置失败\n${JSON.stringify(err)}`);
    }
};
