import { BlogPost } from '../models/blog-post';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { inputPostSettings } from '../utils/input-post-settings';

export const modifyPostSettings = async (post: BlogPost) => {
    if (!post || post.id < 0) {
        return;
    }

    const editDto = await blogPostService.fetchPostEditDto(post.id);
    const postEditDto = editDto.post;
    const inputSettings = await inputPostSettings(post.title, postEditDto);
    if (!inputSettings) {
        return;
    }

    Object.assign(postEditDto, inputSettings);
    try {
        await blogPostService.updatePost(postEditDto);
        AlertService.info('更新博文设置成功');
    } catch (err) {
        AlertService.error(err instanceof Error ? err.message : `更新博文设置失败\n${JSON.stringify(err)}`);
    }
};
