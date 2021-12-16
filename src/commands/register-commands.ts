import { openMyAccountSettings } from './open-my-account-settings';
import { openMyBlogManagementBackground } from './open-my-blog-management-background';
import { openMyHomePage } from './open-my-home-page';
import { login, logout } from './login';
import * as vscode from 'vscode';
import { openMyBlog } from './open-my-blog';
import { globalState } from '../services/global-state';
import { gotoNextPostsList, gotoPreviousPostsList, refreshPostsList, seekPostsList } from './posts-list';
import { openPostInVscode } from './open-post-in-vscode';
import { savePost } from './save-post';
import { createLocalDraft } from './create-local-draft';

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
        vscode.commands.registerCommand(`${appName}.save-post`, savePost),
        vscode.commands.registerCommand(`${appName}.create-local-draft`, createLocalDraft),
    ];
    context?.subscriptions.push(...disposables);
};
