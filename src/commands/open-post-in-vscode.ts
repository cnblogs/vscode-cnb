import * as fs from 'fs';
import { FileSystemError, Uri, workspace } from 'vscode';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { Settings } from '../services/settings.service';
import { openPostFile } from './open-post-file';

export const openPostInVscode = async (postId: number, forceUpdatePostFile = false) => {
    const mappedPostFilePath = PostFileMapManager.getFilePath(postId);
    const isFileExist = await new Promise<boolean>(resolve => {
        if (!mappedPostFilePath) {
            resolve(false);
            return;
        }
        fs.stat(mappedPostFilePath, (err, stat) => {
            resolve(!err && stat.isFile());
        });
    });
    if (isFileExist && !forceUpdatePostFile) {
        await openPostFile(mappedPostFilePath!);
        return;
    }

    const postEditDto = await blogPostService.fetchPostEditDto(postId);
    const post = postEditDto.post;

    const workspaceUri = Settings.workspaceUri;
    await createDirectoryIfNotExist(workspaceUri);
    const fileUri = mappedPostFilePath
        ? Uri.file(mappedPostFilePath!)
        : Uri.joinPath(workspaceUri, `${postId}-${post.title}.${postEditDto.post.isMarkdown ? 'md' : 'html'}`);
    await workspace.fs.writeFile(fileUri, new TextEncoder().encode(postEditDto.post.postBody));
    await PostFileMapManager.updateOrCreate(postId, fileUri.fsPath);
    await openPostFile(post);
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
