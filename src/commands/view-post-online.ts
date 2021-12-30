import { commands, Uri } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';

export const viewPostOnline = async (input: BlogPost | Uri) => {
    let post: BlogPost | undefined = input instanceof BlogPost ? input : undefined;
    if (input instanceof Uri) {
        const postId = PostFileMapManager.getPostId(input.fsPath);
        if (postId) {
            post = (await blogPostService.fetchPostEditDto(postId)).post;
        }
    }

    if (!post) {
        return;
    }

    const url = post.url.startsWith('//') ? `https:${post.url}` : post.url;
    await commands.executeCommand('vscode.open', Uri.parse(url));
};
