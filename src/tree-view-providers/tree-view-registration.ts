import { globalState } from '../services/global-state';
import vscode from 'vscode';
import { accountViewDataProvider } from './account-view-data-provider';
import { PostsListTreeItem, postsDataProvider } from './posts-data-provider';
import { postCategoriesDataProvider } from './post-categories-tree-data-provider';
import { PostCategoriesListTreeItem } from './models/categories-list-tree-item';

export const extensionViews: {
    postsList?: vscode.TreeView<PostsListTreeItem>;
    anotherPostsList?: vscode.TreeView<PostsListTreeItem>;
    account?: vscode.TreeView<vscode.TreeItem>;
    postCategoriesList?: vscode.TreeView<PostCategoriesListTreeItem>;
    postsLists: () => vscode.TreeView<PostsListTreeItem>[];
    visiblePostsList: () => vscode.TreeView<PostsListTreeItem> | undefined;
} = {
    postsLists: () =>
        [extensionViews.postsList, extensionViews.anotherPostsList].filter(
            (x): x is vscode.TreeView<PostsListTreeItem> => x != null
        ),
    visiblePostsList: () => extensionViews.postsLists().find(x => x.visible),
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
