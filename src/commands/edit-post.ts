import { homedir } from 'os';
import { commands, FileSystemError, Uri, workspace } from 'vscode';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';

// eslint-disable-next-line no-unused-vars
export const editPost = async (postId: number) => {
    const postEditDto = await blogPostService.fetchPostEditDto(postId);
    const workspaceUri = Uri.joinPath(Uri.file(homedir()), 'Documents', '.Cnblogs');
    await createDirectoryIfNotExist(workspaceUri);
    const fileUri = Uri.joinPath(
        workspaceUri,
        `${postEditDto.post.id}-${postEditDto.post.title}.${postEditDto.post.isMarkdown ? 'md' : 'html'}`
    );
    await workspace.fs.writeFile(fileUri, new TextEncoder().encode(postEditDto.post.postBody));
    await commands.executeCommand('vscode.open', fileUri, { preview: false }, postEditDto.post.title);
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
