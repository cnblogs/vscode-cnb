import { commands, Uri } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { PostFileMapManager } from '../services/post-file-map';

export const revealLocalPostFileInOs = (post: BlogPost) => {
    if (!post) {
        return;
    }
    const postFilePath = PostFileMapManager.getFilePath(post.id);
    if (!postFilePath) {
        return;
    }

    commands.executeCommand('revealFileInOS', Uri.file(postFilePath));
};
