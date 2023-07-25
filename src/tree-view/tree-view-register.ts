import { globalCtx } from '@/service/global-ctx'
import { TreeView, TreeItem } from 'vscode'
import { accountViewDataProvider } from './provider/account-view-data-provider'
import { PostListTreeItem, postDataProvider } from './provider/post-data-provider'
import { postCategoryDataProvider } from './provider/post-category-tree-data-provider'
import { PostCategoriesListTreeItem } from './model/category-list-tree-item'
import { IDisposable } from '@fluentui/react'
import { BlogExportTreeItem } from '@/tree-view/model/blog-export'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { regTreeView } from '@/infra/tree-view'
import { naviViewDataProvider } from '@/tree-view/navi-view'

const _views: {
    postList?: TreeView<PostListTreeItem>
    anotherPostList?: TreeView<PostListTreeItem>
    postCategoriesList?: TreeView<PostCategoriesListTreeItem>
    blogExport?: TreeView<BlogExportTreeItem>
    account?: TreeView<TreeItem>
    navi?: TreeView<TreeItem>

    postLists: () => TreeView<PostListTreeItem>[]
    visiblePostList: () => TreeView<PostListTreeItem> | undefined
} = {
    postLists: () =>
        [_views.postList, _views.anotherPostList].filter((x): x is TreeView<PostListTreeItem> => x != null),
    visiblePostList: () => _views.postLists().find(x => x.visible),
}

export function setupExtTreeView() {
    _views.postList = regTreeView('cnblogs-post-list', {
        treeDataProvider: postDataProvider,
        canSelectMany: true,
    })
    _views.anotherPostList = regTreeView('cnblogs-post-list-another', {
        treeDataProvider: postDataProvider,
        canSelectMany: true,
    })
    _views.postCategoriesList = regTreeView<PostCategoriesListTreeItem>('cnblogs-post-category-list', {
        treeDataProvider: postCategoryDataProvider,
        canSelectMany: true,
    })
    _views.blogExport = regTreeView<BlogExportTreeItem>('vscode-cnb.blog-export', {
        canSelectMany: false,
        treeDataProvider: BlogExportProvider.instance,
    })
    _views.account = regTreeView('cnblogs-account', {
        treeDataProvider: accountViewDataProvider,
        canSelectMany: false,
    })
    _views.navi = regTreeView('cnblogs-navi', {
        treeDataProvider: naviViewDataProvider,
        canSelectMany: false,
    })

    const disposables: IDisposable[] = []
    for (const [, item] of Object.entries(_views)) typeof item === 'function' ? undefined : disposables.push(item)

    globalCtx.extCtx.subscriptions.push(...disposables)

    return extTreeViews
}

export class ExtTreeViews implements Required<typeof _views> {
    postLists = _views.postLists
    visiblePostList = _views.visiblePostList

    get postList(): TreeView<PostListTreeItem> {
        return this.getTreeView('postList')
    }

    get anotherPostList() {
        return this.getTreeView('anotherPostList')
    }

    get blogExport() {
        return this.getTreeView('blogExport')
    }

    get account() {
        return this.getTreeView('account')
    }

    get postCategoriesList() {
        return this.getTreeView('postCategoriesList')
    }

    get navi() {
        return this.getTreeView('navi')
    }

    private getTreeView<TKey extends keyof Omit<typeof _views, 'postLists' | 'visiblePostList'>>(
        name: TKey
    ): NonNullable<(typeof _views)[TKey]> {
        const value = _views[name]
        if (!value) throw Error(`tree view ${name} not registered yet`)
        return value
    }
}

export const extTreeViews = new ExtTreeViews()
