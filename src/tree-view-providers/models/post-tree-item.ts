import { TreeItem, TreeItemCollapsibleState } from 'vscode'
import { Post } from '@/models/post'
import { toTreeItem } from '../converters'
import { BaseTreeItemSource } from './base-tree-item-source'

export class PostTreeItem<TParent = unknown> extends BaseTreeItemSource {
    parent?: TParent

    constructor(public readonly post: Post, public readonly showMetadata = true) {
        super()
    }

    toTreeItem(): TreeItem | Promise<TreeItem> {
        const value = toTreeItem(this.post)
        return value instanceof Promise ? value.then(this.assign) : this.assign(value)
    }

    private readonly assign = (treeItem: TreeItem) =>
        Object.assign<TreeItem, TreeItem>(
            treeItem,
            this.showMetadata
                ? { collapsibleState: TreeItemCollapsibleState.Collapsed }
                : { collapsibleState: TreeItemCollapsibleState.None }
        )
}
