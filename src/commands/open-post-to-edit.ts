import { commands, Uri } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { LocalPostFile } from '../models/local-post-file';
import { PostFileMapManager } from '../services/post-file-map';

export const openPostToEdit = async (post: LocalPostFile | BlogPost | string) => {
    let filePath = '';
    if (post instanceof LocalPostFile) {
        filePath = post.filePath;
    } else if (post instanceof BlogPost) {
        filePath = PostFileMapManager.getFilePath(post.id) ?? '';
    } else {
        filePath = post;
    }
    if (!filePath) {
        return;
    }
    await commands.executeCommand('vscode.open', Uri.file(filePath), {
        preview: false,
    });
};
