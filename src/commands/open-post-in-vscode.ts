import { commands, FileSystemError, Uri, workspace } from 'vscode';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { Settings } from '../services/settings.service';

export const openPostInVscode = async (postId: number, forceUpdatePostFile = false) => {
    const postEditDto = await blogPostService.fetchPostEditDto(postId);
    const postDto = postEditDto.post;
    const mappedFilePath = PostFileMapManager.getFilePath(postId);

    const workspaceUri = Settings.workspaceUri;
    await createDirectoryIfNotExist(workspaceUri);
    const fileUri = mappedFilePath
        ? Uri.file(mappedFilePath)
        : Uri.joinPath(workspaceUri, `${postId}-${postDto.title}.${postEditDto.post.isMarkdown ? 'md' : 'html'}`);
    if (!mappedFilePath) {
        await PostFileMapManager.updateOrCreate(postId, fileUri.fsPath);
    }
    if (!mappedFilePath || forceUpdatePostFile) {
        await workspace.fs.writeFile(fileUri, new TextEncoder().encode(postEditDto.post.postBody));
    }
    commands.executeCommand('vscode.open', fileUri, { preview: false }, postEditDto.post.title);
};

const createDirectoryIfNotExist = async (uri: Uri) => {
    try {
        await workspace.fs.readDirectory(uri);
    } catch (err) {
        if (err instanceof FileSystemError) {
            await workspace.fs.createDirectory(uri);
        }
        AlertService.error('create workspace directory failed');
        console.error(err);
    }
};
