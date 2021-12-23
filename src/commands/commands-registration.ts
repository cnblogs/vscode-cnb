import { openMyAccountSettings } from './open-my-account-settings';
import { openMyBlogManagementBackground } from './open-my-blog-management-background';
import { openMyHomePage } from './open-my-home-page';
import { login, logout } from './login';
import * as vscode from 'vscode';
import { openMyBlog } from './open-my-blog';
import { globalState } from '../services/global-state';
import { gotoNextPostsList, gotoPreviousPostsList, refreshPostsList, seekPostsList } from './posts-list';
import { openPostInVscode } from './open-post-in-vscode';
import { saveLocalDraftToCnblogs, savePostFileToCnblogs, savePostToCnblogs } from './save-post';
import { createLocalDraft } from './create-local-draft';
import { deleteLocalDraft } from './delete-local-draft';
import { deleteSelectedPosts } from './delete-post';
import { modifyPostSettings } from './modify-post-settings';
import { uploadImageFromClipboard } from './upload-image/upload-clipboard-image';
import { uploadLocalDiskImage } from './upload-image/upload-local-disk-image';
import { uploadImage } from './upload-image/upload-image';
import { revealLocalPostFileInOs } from './reveal-local-post-in-os';
import { showPostToLocalFileInfo } from './show-post-to-local-file-info';

export const registerCommands = () => {
    const context = globalState.extensionContext;
    const appName = globalState.extensionName;
    const disposables = [
        vscode.commands.registerCommand(`${appName}.login`, login),
        vscode.commands.registerCommand(`${appName}.open-my-blog`, openMyBlog),
        vscode.commands.registerCommand(`${appName}.open-my-home-page`, openMyHomePage),
        vscode.commands.registerCommand(
            `${appName}.open-my-blog-management-background`,
            openMyBlogManagementBackground
        ),
        vscode.commands.registerCommand(`${appName}.open-my-account-settings`, openMyAccountSettings),
        vscode.commands.registerCommand(`${appName}.logout`, logout),
        vscode.commands.registerCommand(`${appName}.refresh-posts-list`, refreshPostsList),
        vscode.commands.registerCommand(`${appName}.previous-posts-list`, gotoPreviousPostsList),
        vscode.commands.registerCommand(`${appName}.seek-posts-list`, seekPostsList),
        vscode.commands.registerCommand(`${appName}.next-posts-list`, gotoNextPostsList),
        vscode.commands.registerCommand(`${appName}.edit-post`, openPostInVscode),
        vscode.commands.registerCommand(`${appName}.save-post`, savePostToCnblogs),
        vscode.commands.registerCommand(`${appName}.modify-post-settings`, modifyPostSettings),
        vscode.commands.registerCommand(`${appName}.delete-post`, deleteSelectedPosts),
        vscode.commands.registerCommand(`${appName}.create-local-draft`, createLocalDraft),
        vscode.commands.registerCommand(`${appName}.delete-local-draft`, deleteLocalDraft),
        vscode.commands.registerCommand(`${appName}.save-local-draft-to-cnblogs`, saveLocalDraftToCnblogs),
        vscode.commands.registerCommand(`${appName}.save-post-file-to-cnblogs`, savePostFileToCnblogs),
        vscode.commands.registerCommand(`${appName}.upload-clipboard-image`, uploadImageFromClipboard),
        vscode.commands.registerCommand(`${appName}.upload-local-disk-image`, uploadLocalDiskImage),
        vscode.commands.registerCommand(`${appName}.upload-image`, uploadImage),
        vscode.commands.registerCommand(`${appName}.reveal-local-post-file-in-os`, revealLocalPostFileInOs),
        vscode.commands.registerCommand(`${appName}.show-post-to-local-file-info`, showPostToLocalFileInfo),
    ];
    context?.subscriptions.push(...disposables);
};
