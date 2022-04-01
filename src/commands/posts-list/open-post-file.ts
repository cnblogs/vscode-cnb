import { commands, TextDocumentShowOptions, Uri } from 'vscode';
import { Post } from '../../models/post';
import { LocalFileService } from '../../services/local-draft.service';
import { PostFileMapManager } from '../../services/post-file-map';

export const openPostFile = async (post: LocalFileService | Post | string, options?: TextDocumentShowOptions) => {
    let filePath = '';
    if (post instanceof LocalFileService) {
        filePath = post.filePath;
    } else if (post instanceof Post) {
        filePath = PostFileMapManager.getFilePath(post.id) ?? '';
    } else {
        filePath = post;
    }
    if (!filePath) {
        return;
    }
    await commands.executeCommand(
        'vscode.open',
        Uri.file(filePath),
        Object.assign({ preview: false } as TextDocumentShowOptions, options ?? {})
    );
};
