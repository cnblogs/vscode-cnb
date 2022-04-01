import { commands, Uri } from 'vscode';
import { Post } from '../models/post';
import { PostFileMapManager } from '../services/post-file-map';

export const openPostInBlogAdmin = (item: Post | Uri) => {
    if (!item) {
        return;
    }

    const postId = item instanceof Post ? item.id : PostFileMapManager.getPostId(item.fsPath) ?? -1;

    void commands.executeCommand('vscode.open', Uri.parse(`https://i.cnblogs.com/posts/edit;postId=${postId}`));
};
