import { globalState } from '../services/global-state';
import vscode from 'vscode';
import { accountViewDataProvider } from './account-view-data-provider';
import { PostDataProviderItem, postsDataProvider } from './posts-data-provider';
import { PostCategory } from '../models/post-category';
import { postCategoriesDataProvider } from './categories-view-data-provider';

export const extensionViews: {
    postsList?: vscode.TreeView<PostDataProviderItem>;
    anotherPostsList?: vscode.TreeView<PostDataProviderItem>;
    account?: vscode.TreeView<vscode.TreeItem>;
    postCategoriesList?: vscode.TreeView<PostCategory>;
    visiblePostList: () => vscode.TreeView<PostDataProviderItem> | undefined;
} = {
    visiblePostList: () => {
        const lists = [extensionViews.postsList, extensionViews.anotherPostsList];
        return lists.find(x => x && x.visible);
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
