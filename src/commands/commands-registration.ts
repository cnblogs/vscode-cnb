import { commands } from 'vscode';
import { openMyAccountSettings } from './open-my-account-settings';
import { openMyWebBlogConsole } from './open-my-blog-management-background';
import { openMyHomePage } from './open-my-home-page';
import { login, logout } from './login';
import { openMyBlog } from './open-my-blog';
import { globalState } from '../services/global-state';
import {
    gotoNextPostsList,
    gotoPreviousPostsList,
    refreshPostsList,
    seekPostsList,
} from './posts-list/refresh-posts-list';
import { savePostFileToCnblogs, savePostToCnblogs } from './posts-list/save-post';
import { createLocalDraft } from './posts-list/create-local-draft';
import { deleteSelectedPosts } from './posts-list/delete-post';
import { modifyPostSettings } from './posts-list/modify-post-settings';
import { uploadImage } from './upload-image/upload-image';
import { revealLocalPostFileInOs } from './reveal-local-post-file-in-os';
import { showLocalFileToPostInfo } from './show-local-file-to-post-info';
import { newPostCategory } from './post-category/new-post-category';
import { refreshPostCategoriesList } from './post-category/refresh-post-categories-list';
import { handleUpdatePostCategory } from './post-category/update-post-category';
import { openPostInVscode } from './posts-list/open-post-in-vscode';
import { deletePostToLocalFileMap } from './posts-list/delete-post-to-local-file-map';
import { renamePost } from './posts-list/rename-post';
import { openPostInBlogAdmin } from './open-post-in-blog-admin';
import { openWorkspace } from './open-workspace';
import { setWorkspace } from './set-workspace';
import { revealWorkspaceInOs } from './reveal-workspace-in-os';
import { viewPostOnline } from './view-post-online';
import { exportPostToPdf } from './pdf/export-pdf.command';
import { pullPostRemoteUpdates } from './pull-post-remote-updates';
import { extractImages } from './extract-images';
import { clearPostsSearchResults, refreshPostsSearchResults, searchPosts } from './posts-list/search';
import { handleDeletePostCategories } from './post-category/delete-selected-categories';
import { PublishIngCommandHandler } from '@/commands/ing/publish-ing';

export const registerCommands = () => {
    const context = globalState.extensionContext;
    const appName = globalState.extensionName;
    const disposables = [
        commands.registerCommand(`${appName}.login`, login),
        commands.registerCommand(`${appName}.open-my-blog`, openMyBlog),
        commands.registerCommand(`${appName}.open-my-home-page`, openMyHomePage),
        commands.registerCommand(`${appName}.open-my-blog-management-background`, openMyWebBlogConsole),
        commands.registerCommand(`${appName}.open-my-account-settings`, openMyAccountSettings),
        commands.registerCommand(`${appName}.logout`, logout),
        commands.registerCommand(`${appName}.refresh-posts-list`, refreshPostsList),
        commands.registerCommand(`${appName}.previous-posts-list`, gotoPreviousPostsList),
        commands.registerCommand(`${appName}.seek-posts-list`, seekPostsList),
        commands.registerCommand(`${appName}.next-posts-list`, gotoNextPostsList),
        commands.registerCommand(`${appName}.edit-post`, openPostInVscode),
        commands.registerCommand(`${appName}.save-post`, savePostToCnblogs),
        commands.registerCommand(`${appName}.modify-post-settings`, modifyPostSettings),
        commands.registerCommand(`${appName}.delete-post`, deleteSelectedPosts),
        commands.registerCommand(`${appName}.create-local-draft`, createLocalDraft),
        commands.registerCommand(`${appName}.save-post-file-to-cnblogs`, savePostFileToCnblogs),
        commands.registerCommand(`${appName}.pull-post-remote-updates`, pullPostRemoteUpdates),
        commands.registerCommand(`${appName}.upload-clipboard-image`, () => uploadImage(true, 'clipboard')),
        commands.registerCommand(`${appName}.upload-local-disk-image`, () => uploadImage(true, 'local')),
        commands.registerCommand(`${appName}.upload-image`, () => uploadImage(true)),
        commands.registerCommand(`${appName}.reveal-local-post-file-in-os`, revealLocalPostFileInOs),
        commands.registerCommand(`${appName}.show-post-to-local-file-info`, showLocalFileToPostInfo),
        commands.registerCommand(`${appName}.new-post-category`, newPostCategory),
        commands.registerCommand(`${appName}.delete-selected-post-categories`, handleDeletePostCategories),
        commands.registerCommand(`${appName}.refresh-post-categories-list`, refreshPostCategoriesList),
        commands.registerCommand(`${appName}.update-post-category`, handleUpdatePostCategory),
        commands.registerCommand(`${appName}.delete-post-to-local-file-map`, deletePostToLocalFileMap),
        commands.registerCommand(`${appName}.rename-post`, renamePost),
        commands.registerCommand(`${appName}.open-post-in-blog-admin`, openPostInBlogAdmin),
        commands.registerCommand(`${appName}.open-workspace`, openWorkspace),
        commands.registerCommand(`${appName}.set-workspace`, setWorkspace),
        commands.registerCommand(`${appName}.reveal-workspace-in-os`, revealWorkspaceInOs),
        commands.registerCommand(`${appName}.view-post-online`, viewPostOnline),
        commands.registerCommand(`${appName}.export-post-to-pdf`, exportPostToPdf),
        commands.registerCommand(`${appName}.extract-images`, extractImages),
        commands.registerCommand(`${appName}.search-posts`, searchPosts),
        commands.registerCommand(`${appName}.clear-posts-search-results`, clearPostsSearchResults),
        commands.registerCommand(`${appName}.refresh-posts-search-results`, refreshPostsSearchResults),
        commands.registerCommand(`${appName}.ing.publish`, () => new PublishIngCommandHandler('input').handle()),
        commands.registerCommand(`${appName}.ing.publish-selection`, () =>
            new PublishIngCommandHandler('selection').handle()
        ),
    ];
    context?.subscriptions.push(...disposables);
};
