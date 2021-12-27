import { commands, Uri } from 'vscode';
import { BlogPost } from '../../models/blog-post';
import { LocalDraftFile } from '../../models/local-draft-file';
import { PostFileMapManager } from '../../services/post-file-map';

export const openPostFile = async (post: LocalDraftFile | BlogPost | string) => {
    let filePath = '';
    if (post instanceof LocalDraftFile) {
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
