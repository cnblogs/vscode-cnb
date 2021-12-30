import { commands, Uri } from 'vscode';
import { Post } from '../../models/post';
import { LocalDraftFile } from '../../models/local-draft-file';
import { PostFileMapManager } from '../../services/post-file-map';

export const openPostFile = async (post: LocalDraftFile | Post | string) => {
    let filePath = '';
    if (post instanceof LocalDraftFile) {
        filePath = post.filePath;
    } else if (post instanceof Post) {
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
