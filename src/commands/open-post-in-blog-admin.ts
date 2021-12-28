import { commands, Uri } from 'vscode';
import { BlogPost } from '../models/blog-post';

export const openPostInBlogAdmin = (item: BlogPost | Uri) => {
    if (!item) {
        return;
    }

    const postId = item instanceof BlogPost ? item.id : -1;

    commands.executeCommand('vscode.open', Uri.parse(`https://i.cnblogs.com/posts/edit;postId=${postId}`));
};