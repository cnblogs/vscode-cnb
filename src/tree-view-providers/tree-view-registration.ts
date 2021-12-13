import { globalManager } from './../models/global-manager';
import * as vscode from 'vscode';
import { AccountViewDataProvider } from './account-view-data-provider';
import { postsDataProvider } from './blog-posts-data-provider';

export const registerTreeViews = () => {
    const disposables = [
        vscode.window.createTreeView('cnblogs-posts-list', {
            treeDataProvider: postsDataProvider,
        }),
        vscode.window.createTreeView('cnblogs-account', {
            treeDataProvider: new AccountViewDataProvider(),
        }),
    ];
    globalManager.extensionContext?.subscriptions.push(...disposables);
};
