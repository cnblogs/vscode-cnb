import * as fs from 'fs';
import path = require('path');
import { FileSystemError, MessageOptions, Uri, window, workspace } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMapManager } from '../services/post-file-map';
import { Settings } from '../services/settings.service';
import { openPostFile } from './open-post-file';

const generateLocalPostFileUri = (post: BlogPost, includePostId = false): Uri => {
    const workspaceUri = Settings.workspaceUri;
    const ext = `.${post.isMarkdown ? 'md' : 'html'}`;
    const postIdSegment = includePostId ? `.${post.id}` : '';
    return Uri.joinPath(workspaceUri, `${post.title}${postIdSegment}${ext}`);
};

export const openPostInVscode = async (postId: number, forceUpdateLocalPostFile = false) => {
    let mappedPostFilePath = PostFileMapManager.getFilePath(postId);
    const isFileExist = mappedPostFilePath ? fs.existsSync(mappedPostFilePath) : false;
    if (isFileExist && !forceUpdateLocalPostFile) {
        await openPostFile(mappedPostFilePath!);
        return;
    }
    // 本地文件已经被删除了, 确保重新生成博文与本地文件的关联
    if (mappedPostFilePath && !isFileExist) {
        await PostFileMapManager.updateOrCreate(postId, '');
        mappedPostFilePath = undefined;
    }

    const postEditDto = await blogPostService.fetchPostEditDto(postId);
    const post = postEditDto.post;

    const workspaceUri = Settings.workspaceUri;
    await createDirectoryIfNotExist(workspaceUri);
    let fileUri = mappedPostFilePath ? Uri.file(mappedPostFilePath) : generateLocalPostFileUri(post);

    // 博文尚未关联到本地文件的情况
    if (!mappedPostFilePath) {
        // 本地存在和博文同名的文件, 询问用户是要覆盖还是同时保留两者
        if (fs.existsSync(fileUri.fsPath)) {
            let conflictOptions = [
                '保留本地文件(这会新建另一个文件名中包含博文id的文件)',
                '覆盖本地文件(会导致本地文件中内容丢失)',
            ];
            const selectedOption = await window.showInformationMessage(
                `无法保存博文到本地以进行编辑, 文件名冲突`,
                { detail: `本地已存在名为"${path.basename(fileUri.fsPath)}"的文件`, modal: true } as MessageOptions,
                ...conflictOptions
            );
            switch (selectedOption) {
                case conflictOptions[0]:
                    fileUri = generateLocalPostFileUri(post, true);
                    break;
                // 取消, 直接返回, 不进行任何操作
                case undefined:
                    return;
            }
        }
    }

    // 博文内容写入本地文件, 若文件不存在, 会自动创建对应的文件
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
