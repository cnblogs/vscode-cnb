import { openMyAccountSettings } from './open-my-account-settings';
import { openMyBlogManagementBackground } from './open-my-blog-management-background';
import { openMyHomePage } from './open-my-home-page';
import { login, logout } from './login';
import * as vscode from 'vscode';
import { openMyBlog } from './open-my-blog';
import { globalManager } from '../models/global-manager';
import { gotoNextPostsList, gotoPreviousPostsList, refreshPostsList } from './posts-list';

export const registerCommands = () => {
    const context = globalManager.extensionContext;
    const appName = globalManager.extensionName;
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
        vscode.commands.registerCommand(`${appName}.next-posts-list`, gotoNextPostsList),
    ];
    context?.subscriptions.push(...disposables);
};
