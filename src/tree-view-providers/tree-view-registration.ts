import { globalManager } from '../services/global-state';
import * as vscode from 'vscode';
import { AccountViewDataProvider } from './account-view-data-provider';
import { postsDataProvider } from './blog-posts-data-provider';
import { BlogPost } from '../models/blog-post';

export const extensionViews: {
    postsList?: vscode.TreeView<BlogPost>;
    account?: vscode.TreeView<vscode.TreeItem>;
} = {};

export const registerTreeViews = () => {
    extensionViews.account = vscode.window.createTreeView('cnblogs-account', {
        treeDataProvider: new AccountViewDataProvider(),
    });
    extensionViews.postsList = vscode.window.createTreeView('cnblogs-posts-list', {
        treeDataProvider: postsDataProvider,
    });
    const disposables = [extensionViews.account, extensionViews.postsList];
    globalManager.extensionContext?.subscriptions.push(...disposables);
};
