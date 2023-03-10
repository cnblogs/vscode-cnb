import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source';
import { BlogExportRecordsEntryTreeItem } from '@/tree-view-providers/models/blog-export/blog-export-records-entry';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

export class BlogExportRecordMetadata extends BaseTreeItemSource {
    static readonly contextValue = 'cnb-blog-export-record-meta';

    constructor(
        public readonly parent: BlogExportRecordsEntryTreeItem,
        public readonly blogExportRecordId: number,
        public readonly title: string,
        public readonly description?: string,
        public readonly icon?: TreeItem['iconPath']
    ) {
        super();
    }

    static dateAdded(parent: BlogExportRecordsEntryTreeItem): BlogExportRecordMetadata {
        const { record } = parent;
        return new BlogExportRecordMetadata(parent, record.id, `创建时间: ${record.dateAdded}`);
    }

    static status(parent: BlogExportRecordsEntryTreeItem) {
        const { record } = parent;
        return new BlogExportRecordMetadata(parent, record.id, `创建时间: ${record.dateAdded}`);
    }

    toTreeItem(): TreeItem {
        return {
            contextValue: BlogExportRecordMetadata.contextValue,
            label: this.title,
            description: this.description,
            iconPath: this.icon,
            id: `${BlogExportRecordMetadata.contextValue}-${this.blogExportRecordId}`,
            collapsibleState: TreeItemCollapsibleState.None,
        };
    }
}
