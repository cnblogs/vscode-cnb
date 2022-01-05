import { globalState } from '../services/global-state';
import * as vscode from 'vscode';
import { AccountViewDataProvider } from './account-view-data-provider';
import { PostDataProviderItem, postsDataProvider } from './posts-data-provider';
import { PostCategory } from '../models/post-category';
import { postCategoriesDataProvider } from './categories-view-data-provider';

export const extensionViews: {
    postsList?: vscode.TreeView<PostDataProviderItem>;
    anotherPostsList?: vscode.TreeView<PostDataProviderItem>;
    account?: vscode.TreeView<vscode.TreeItem>;
    postCategoriesList?: vscode.TreeView<PostCategory>;
} = {};

export const registerTreeViews = () => {
    extensionViews.account = vscode.window.createTreeView('cnblogs-account', {
        treeDataProvider: new AccountViewDataProvider(),
        canSelectMany: false,
    });
    extensionViews.postsList = vscode.window.createTreeView('cnblogs-posts-list', {
        treeDataProvider: postsDataProvider,
        canSelectMany: true,
    });
    extensionViews.anotherPostsList = vscode.window.createTreeView('cnblogs-posts-list-another', {
        treeDataProvider: postsDataProvider,
        canSelectMany: true,
    });
    extensionViews.postCategoriesList = vscode.window.createTreeView('cnblogs-post-categories-list', {
        treeDataProvider: postCategoriesDataProvider,
        canSelectMany: true,
    });
    const disposables = [];
    for (const key in extensionViews) {
        disposables.push((extensionViews as any)[key]);
    }
    globalState.extensionContext?.subscriptions.push(...disposables);
};
