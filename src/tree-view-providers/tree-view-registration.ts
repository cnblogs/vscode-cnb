import { globalState } from '../services/global-state';
import vscode from 'vscode';
import { accountViewDataProvider } from './account-view-data-provider';
import { PostTreeViewItem, postsDataProvider } from './posts-data-provider';
import { PostCategory } from '../models/post-category';
import { postCategoriesDataProvider } from './categories-view-data-provider';

export const extensionViews: {
    postsList?: vscode.TreeView<PostTreeViewItem>;
    anotherPostsList?: vscode.TreeView<PostTreeViewItem>;
    account?: vscode.TreeView<vscode.TreeItem>;
    postCategoriesList?: vscode.TreeView<PostCategory>;
    visiblePostsList: () => vscode.TreeView<PostTreeViewItem> | undefined;
} = {
    visiblePostsList: () => {
        return [extensionViews.postsList, extensionViews.anotherPostsList].find(x => x && x.visible);
    },
};

export const registerTreeViews = () => {
    extensionViews.account = vscode.window.createTreeView('cnblogs-account', {
        treeDataProvider: accountViewDataProvider,
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
