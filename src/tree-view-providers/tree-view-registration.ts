import { globalContext } from '../services/global-state';
import vscode from 'vscode';
import { accountViewDataProvider } from './account-view-data-provider';
import { PostsListTreeItem, postsDataProvider } from './posts-data-provider';
import { postCategoriesDataProvider } from './post-categories-tree-data-provider';
import { PostCategoriesListTreeItem } from './models/categories-list-tree-item';
import { IDisposable } from '@fluentui/react';

const _views: {
    postsList?: vscode.TreeView<PostsListTreeItem>;
    anotherPostsList?: vscode.TreeView<PostsListTreeItem>;
    account?: vscode.TreeView<vscode.TreeItem>;
    postCategoriesList?: vscode.TreeView<PostCategoriesListTreeItem>;
    postsLists: () => vscode.TreeView<PostsListTreeItem>[];
    visiblePostsList: () => vscode.TreeView<PostsListTreeItem> | undefined;
} = {
    postsLists: () =>
        [_views.postsList, _views.anotherPostsList].filter((x): x is vscode.TreeView<PostsListTreeItem> => x != null),
    visiblePostsList: () => _views.postsLists().find(x => x.visible),
};
let _hasRegistered = false;

export const registerTreeViews = () => {
    if (_hasRegistered) return extensionViews;

    _views.account = vscode.window.createTreeView('cnblogs-account', {
        treeDataProvider: accountViewDataProvider,
        canSelectMany: false,
    });
    _views.postsList = vscode.window.createTreeView('cnblogs-posts-list', {
        treeDataProvider: postsDataProvider,
        canSelectMany: true,
    });
    _views.anotherPostsList = vscode.window.createTreeView('cnblogs-posts-list-another', {
        treeDataProvider: postsDataProvider,
        canSelectMany: true,
    });
    _views.postCategoriesList = vscode.window.createTreeView<PostCategoriesListTreeItem>(
        'cnblogs-post-categories-list',
        {
            treeDataProvider: postCategoriesDataProvider,
            canSelectMany: true,
        }
    );

    _hasRegistered = true;

    const disposables: IDisposable[] = [];
    for (const [, item] of Object.entries(_views)) typeof item === 'function' ? undefined : disposables.push(item);

    globalContext.extensionContext.subscriptions.push(...disposables);

    return extensionViews;
};

class ExtensionViews implements Required<typeof _views> {
    postsLists = _views.postsLists;
    visiblePostsList = _views.visiblePostsList;

    get postsList(): vscode.TreeView<PostsListTreeItem> {
        return this.getTreeView('postsList');
    }

    get anotherPostsList() {
        return this.getTreeView('anotherPostsList');
    }

    get account() {
        return this.getTreeView('account');
    }

    get postCategoriesList() {
        return this.getTreeView('postCategoriesList');
    }

    private getTreeView<TKey extends keyof Omit<typeof _views, 'postsLists' | 'visiblePostsList'>>(
        name: TKey
    ): NonNullable<typeof _views[TKey]> {
        const value = _views[name];
        if (!value) throw Error(`tree view ${name} not registered yet`);
        return value;
    }
}

export const extensionViews = new ExtensionViews();
