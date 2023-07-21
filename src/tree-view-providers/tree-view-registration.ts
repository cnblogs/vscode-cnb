import { globalCtx } from '@/services/global-ctx'
import vscode from 'vscode'
import { accountViewDataProvider } from './account-view-data-provider'
import { PostListTreeItem, postDataProvider } from './post-data-provider'
import { postCategoriesDataProvider } from './post-categories-tree-data-provider'
import { PostCategoriesListTreeItem } from './models/categories-list-tree-item'
import { IDisposable } from '@fluentui/react'
import { BlogExportTreeItem } from '@/tree-view-providers/models/blog-export'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { regTreeView } from '@/utils/tree-view'

const _views: {
    postList?: vscode.TreeView<PostListTreeItem>
    anotherPostList?: vscode.TreeView<PostListTreeItem>
    account?: vscode.TreeView<vscode.TreeItem>
    postCategoriesList?: vscode.TreeView<PostCategoriesListTreeItem>
    blogExport?: vscode.TreeView<BlogExportTreeItem>
    postLists: () => vscode.TreeView<PostListTreeItem>[]
    visiblePostList: () => vscode.TreeView<PostListTreeItem> | undefined
} = {
    postLists: () =>
        [_views.postList, _views.anotherPostList].filter((x): x is vscode.TreeView<PostListTreeItem> => x != null),
    visiblePostList: () => _views.postLists().find(x => x.visible),
}
let _hasRegistered = false

export function setupExtTreeView() {
    if (_hasRegistered) return extViews

    _views.account = regTreeView('cnblogs-account', {
        treeDataProvider: accountViewDataProvider,
        canSelectMany: false,
    })
    _views.postList = regTreeView('cnblogs-post-list', {
        treeDataProvider: postDataProvider,
        canSelectMany: true,
    })
    _views.anotherPostList = regTreeView('cnblogs-post-list-another', {
        treeDataProvider: postDataProvider,
        canSelectMany: true,
    })
    _views.postCategoriesList = regTreeView<PostCategoriesListTreeItem>('cnblogs-post-categories-list', {
        treeDataProvider: postCategoriesDataProvider,
        canSelectMany: true,
    })
    _views.blogExport = regTreeView<BlogExportTreeItem>('vscode-cnb.blog-export', {
        canSelectMany: false,
        treeDataProvider: BlogExportProvider.instance,
    })
    _hasRegistered = true

    const disposables: IDisposable[] = []
    for (const [, item] of Object.entries(_views)) typeof item === 'function' ? undefined : disposables.push(item)

    globalCtx.extCtx.subscriptions.push(...disposables)

    return extViews
}

class ExtViews implements Required<typeof _views> {
    postLists = _views.postLists
    visiblePostList = _views.visiblePostList

    get postList(): vscode.TreeView<PostListTreeItem> {
        return this.getTreeView('postList')
    }

    get anotherPostList() {
        return this.getTreeView('anotherPostList')
    }

    get account() {
        return this.getTreeView('account')
    }

    get postCategoriesList() {
        return this.getTreeView('postCategoriesList')
    }

    get blogExport() {
        return this.getTreeView('blogExport')
    }

    private getTreeView<TKey extends keyof Omit<typeof _views, 'postLists' | 'visiblePostList'>>(
        name: TKey
    ): NonNullable<(typeof _views)[TKey]> {
        const value = _views[name]
        if (!value) throw Error(`tree view ${name} not registered yet`)
        return value
    }
}

export const extViews = new ExtViews()
