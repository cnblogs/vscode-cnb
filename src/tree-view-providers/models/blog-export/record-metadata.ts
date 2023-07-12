import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source'
import { BlogExportRecordTreeItem } from '@/tree-view-providers/models/blog-export/record'
import { TreeItem, TreeItemCollapsibleState } from 'vscode'

export class BlogExportRecordMetadata extends BaseTreeItemSource {
    static readonly contextValue = 'cnb-blog-export-record-meta'

    constructor(
        public readonly parent: BlogExportRecordTreeItem,
        public readonly blogExportRecordId: number,
        public readonly title: string,
        public readonly description?: string,
        public readonly icon?: TreeItem['iconPath']
    ) {
        super()
    }

    static dateAdded(parent: BlogExportRecordTreeItem): BlogExportRecordMetadata {
        const { record } = parent
        return new BlogExportRecordMetadata(parent, record.id, `创建时间: ${record.dateAdded}`)
    }

    static status(parent: BlogExportRecordTreeItem) {
        const { record } = parent
        return new BlogExportRecordMetadata(parent, record.id, `创建时间: ${record.dateAdded}`)
    }

    toTreeItem(): TreeItem {
        return {
            contextValue: BlogExportRecordMetadata.contextValue,
            label: this.title,
            description: this.description,
            iconPath: this.icon,
            collapsibleState: TreeItemCollapsibleState.None,
        }
    }
}
