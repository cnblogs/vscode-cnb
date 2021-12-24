import { globalState } from '../services/global-state';
import * as vscode from 'vscode';
import { AccountViewDataProvider } from './account-view-data-provider';
import { BlogPostDataProviderItem, postsDataProvider } from './blog-posts-data-provider';
import { PostCategory } from '../models/post-category';
import { postCategoriesDataProvider } from './categories-view-data-provider';

export const extensionViews: {
    postsList?: vscode.TreeView<BlogPostDataProviderItem>;
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
    extensionViews.postCategoriesList = vscode.window.createTreeView('cnblogs-post-categories-list', {
        treeDataProvider: postCategoriesDataProvider,
        canSelectMany: true,
    });
    const disposables = [extensionViews.account, extensionViews.postsList, extensionViews.postCategoriesList];
    globalState.extensionContext?.subscriptions.push(...disposables);
};
