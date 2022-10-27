import { commands, Uri, window } from 'vscode';
import { Post } from '../models/post';
import { postService } from '../services/post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { PostTreeItem } from '../tree-view-providers/models/post-tree-item';

export const viewPostOnline = async (input?: Post | PostTreeItem | Uri) => {
    let post: Post | undefined = input instanceof Post ? input : input instanceof PostTreeItem ? input.post : undefined;
    if (!input) {
        input = window.activeTextEditor?.document.uri;
    }
    if (input instanceof Uri) {
        const postId = PostFileMapManager.getPostId(input.fsPath);
        if (postId) {
            post = (await postService.fetchPostEditDto(postId))?.post;
        }
    }

    if (!post) {
        return;
    }

    const url = post.url.startsWith('//') ? `https:${post.url}` : post.url;
    await commands.executeCommand('vscode.open', Uri.parse(url));
};
