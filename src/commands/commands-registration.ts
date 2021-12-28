import { openMyAccountSettings } from './open-my-account-settings';
import { openMyBlogManagementBackground } from './open-my-blog-management-background';
import { openMyHomePage } from './open-my-home-page';
import { login, logout } from './login';
import * as vscode from 'vscode';
import { openMyBlog } from './open-my-blog';
import { globalState } from '../services/global-state';
import {
    gotoNextPostsList,
    gotoPreviousPostsList,
    refreshPostsList,
    seekPostsList,
} from './posts-list/refresh-posts-list';
import { saveLocalDraftToCnblogs, savePostFileToCnblogs, savePostToCnblogs } from './posts-list/save-post';
import { createLocalDraft } from './posts-list/create-local-draft';
import { deleteLocalDraft } from './posts-list/delete-local-draft';
import { deleteSelectedPosts } from './posts-list/delete-post';
import { modifyPostSettings } from './posts-list/modify-post-settings';
import { uploadImageFromClipboard } from './upload-image/upload-clipboard-image';
import { uploadLocalDiskImage } from './upload-image/upload-local-disk-image';
import { uploadImage } from './upload-image/upload-image';
import { revealLocalPostFileInOs } from './reveal-local-post-file-in-os';
import { showLocalFileToPostInfo } from './show-local-file-to-post-info';
import { newPostCategory } from './post-category/new-post-category';
import { deleteSelectedCategories } from './post-category/delete-selected-categoriess';
import { refreshPostCategoriesList } from './post-category/refresh-post-categories-list';
import { updatePostCategory } from './post-category/update-post-category';
import { openPostInVscode } from './posts-list/open-post-in-vscode';
import { deletePostToLocalFileMap } from './posts-list/delete-post-to-local-file-map';
import { renamePost } from './posts-list/rename-post';

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
        vscode.commands.registerCommand(`${appName}.show-post-to-local-file-info`, showLocalFileToPostInfo),
        vscode.commands.registerCommand(`${appName}.new-post-category`, newPostCategory),
        vscode.commands.registerCommand(`${appName}.delete-selected-post-categories`, deleteSelectedCategories),
        vscode.commands.registerCommand(`${appName}.refresh-post-categories-list`, refreshPostCategoriesList),
        vscode.commands.registerCommand(`${appName}.update-post-category`, updatePostCategory),
        vscode.commands.registerCommand(`${appName}.delete-post-to-local-file-map`, deletePostToLocalFileMap),
        vscode.commands.registerCommand(`${appName}.rename-post`, renamePost),
    ];
    context?.subscriptions.push(...disposables);
};
