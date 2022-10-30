import { commands, Uri } from 'vscode';
import { Post } from '../models/post';
import { PostFileMapManager } from '../services/post-file-map';

export const revealLocalPostFileInOs = (post: Post) => {
    if (!post) return;

    const postFilePath = PostFileMapManager.getFilePath(post.id);
    if (!postFilePath) return;

    return commands.executeCommand('revealFileInOS', Uri.file(postFilePath));
};
