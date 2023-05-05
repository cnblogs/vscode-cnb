import fs from 'fs';
import path from 'path';
import { FileSystemError, MessageOptions, Uri, window, workspace } from 'vscode';
import { Post } from '../../models/post';
import { AlertService } from '../../services/alert.service';
import { postService } from '../../services/post.service';
import { PostFileMapManager } from '../../services/post-file-map';
import { Settings } from '../../services/settings.service';
import { openPostFile } from './open-post-file';
import { PostTitleSanitizer } from '../../services/post-title-sanitizer.service';
import { postCategoryService } from '../../services/post-category.service';
import sanitizeFileName from 'sanitize-filename';

const buildLocalPostFileUri = async (post: Post, includePostId = false): Promise<Uri> => {
    const workspaceUri = Settings.workspaceUri;
    const shouldCreateLocalPostFileWithCategory = Settings.createLocalPostFileWithCategory;
    const ext = `.${post.isMarkdown ? 'md' : 'html'}`;
    const postIdSegment = includePostId ? `.${post.id}` : '';
    const { text: postTitle } = await PostTitleSanitizer.sanitize(post);
    if (shouldCreateLocalPostFileWithCategory) {
        const firstCategoryId = post.categoryIds?.[0];
        const category = firstCategoryId ? await postCategoryService.find(firstCategoryId) : null;
        let i = category;
        let categoryTitle = '';
        while (i != null) {
            categoryTitle = path.join(
                sanitizeFileName(i.title, {
                    replacement: invalidChar => (invalidChar === '/' ? '_' : ''),
                }),
                categoryTitle
            );
            i = i.parent;
        }

        return Uri.joinPath(workspaceUri, categoryTitle, `${postTitle}${postIdSegment}${ext}`);
    } else {
        return Uri.joinPath(workspaceUri, `${postTitle}${postIdSegment}${ext}`);
    }
};

export const openPostInVscode = async (postId: number, forceUpdateLocalPostFile = false): Promise<Uri | false> => {
    let mappedPostFilePath = PostFileMapManager.getFilePath(postId);
    const isFileExist = !!mappedPostFilePath && fs.existsSync(mappedPostFilePath);
    if (mappedPostFilePath && isFileExist && !forceUpdateLocalPostFile) {
        await openPostFile(mappedPostFilePath);
        return Uri.file(mappedPostFilePath);
    }
    // 本地文件已经被删除了, 确保重新生成博文与本地文件的关联
    if (mappedPostFilePath && !isFileExist) {
        await PostFileMapManager.updateOrCreate(postId, '');
        mappedPostFilePath = undefined;
    }

    const postEditDto = await postService.fetchPostEditDto(postId);
    if (!postEditDto) return false;

    const post = postEditDto.post;

    const workspaceUri = Settings.workspaceUri;
    await createDirectoryIfNotExist(workspaceUri);
    let fileUri = mappedPostFilePath ? Uri.file(mappedPostFilePath) : await buildLocalPostFileUri(post);

    // 博文尚未关联到本地文件的情况
    if (!mappedPostFilePath) {
        // 本地存在和博文同名的文件, 询问用户是要覆盖还是同时保留两者
        if (fs.existsSync(fileUri.fsPath)) {
            const conflictOptions = [
                '保留本地文件(这会新建另一个文件名中包含博文id的文件)',
                '覆盖本地文件(会导致本地文件中内容丢失)',
            ];
            const selectedOption = await window.showInformationMessage(
                `无法新建博文与本地文件的关联, 文件名冲突`,
                { detail: `本地已存在名为"${path.basename(fileUri.fsPath)}"的文件`, modal: true } as MessageOptions,
                ...conflictOptions
            );
            switch (selectedOption) {
                case conflictOptions[0]:
                    fileUri = await buildLocalPostFileUri(post, true);
                    break;
                // 取消, 直接返回, 不进行任何操作
                case undefined:
                    return false;
            }
        }
    }

    // 博文内容写入本地文件, 若文件不存在, 会自动创建对应的文件
    await workspace.fs.writeFile(fileUri, Buffer.from(postEditDto.post.postBody));
    await PostFileMapManager.updateOrCreate(postId, fileUri.fsPath);
    await openPostFile(post);
    return fileUri;
};

const createDirectoryIfNotExist = async (uri: Uri) => {
    try {
        await workspace.fs.readDirectory(uri);
    } catch (err) {
        if (err instanceof FileSystemError) await workspace.fs.createDirectory(uri);

        AlertService.error('create workspace directory failed');
        console.error(err);
    }
};
