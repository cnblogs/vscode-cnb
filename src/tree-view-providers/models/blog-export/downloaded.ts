import { DownloadedBlogExport } from '@/models/blog-export';
import { DownloadedExportStore } from '@/services/downloaded-export.store';
import { BaseEntryTreeItem } from '@/tree-view-providers/models/base-entry-tree-item';
import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source';
import { parseDownloadedExports } from '@/tree-view-providers/models/blog-export/parser';
import { ExportPostTreeItem } from '@/tree-view-providers/models/blog-export/post';
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item';
import path from 'path';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode';

export type DownloadedExportChildTreeItem = PostTreeItem<DownloadedExportTreeItem> | TreeItem | ExportPostsEntry;

export class DownloadedExportMetadata extends TreeItem {
    readonly parent?: DownloadedExportTreeItem | null;

    static parse(
        options: Partial<DownloadedExportMetadata> & Required<Pick<DownloadedExportMetadata, 'parent' | 'label'>>
    ) {
        return Object.assign(new DownloadedExportMetadata(''), options);
    }
}

export class ExportPostsEntry extends BaseTreeItemSource implements BaseEntryTreeItem<ExportPostTreeItem> {
    constructor(public readonly downloadedExport: DownloadedBlogExport) {
        super();
    }

    toTreeItem(): TreeItem | Promise<TreeItem> {
        return {
            label: '随笔',
            iconPath: new ThemeIcon('files'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    getChildren: () => ExportPostTreeItem[] = () => {
        throw new Error('Not implemented');
    };

    getChildrenAsync: () => Promise<ExportPostTreeItem[]> = async () => {
        const { ExportPostStore } = await import('@/services/blog-export-post.store');
        const { downloadedExport } = this;
        const store = new ExportPostStore(downloadedExport);
        const postTreeItems: ExportPostTreeItem[] = await store.list().then(
            data => data.map(i => new ExportPostTreeItem(this, i)),
            () => []
        );
        store.dispose();

        return postTreeItems;
    };
}

export class DownloadedExportTreeItem
    extends BaseTreeItemSource
    implements BaseEntryTreeItem<DownloadedExportChildTreeItem>
{
    constructor(
        public readonly parent: DownloadedExportsEntryTreeItem,
        public readonly downloadedExport: DownloadedBlogExport
    ) {
        super();
    }

    getChildren: () => DownloadedExportChildTreeItem[] = () => {
        throw new Error('Not implemented');
    };

    getChildrenAsync: () => Promise<DownloadedExportChildTreeItem[]> = () =>
        Promise.resolve([new ExportPostsEntry(this.downloadedExport)]);

    toTreeItem(): TreeItem | Promise<TreeItem> {
        const {
            downloadedExport: { filePath },
        } = this;

        return {
            label: path.basename(filePath),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            iconPath: new ThemeIcon('database'),
        };
    }
}

export class DownloadedExportsEntryTreeItem
    extends BaseTreeItemSource
    implements BaseEntryTreeItem<DownloadedExportTreeItem>
{
    getChildren: () => DownloadedExportTreeItem[] = () => {
        throw new Error('Not implemented');
    };

    getChildrenAsync: () => Promise<DownloadedExportTreeItem[]> = async () =>
        parseDownloadedExports(this, await DownloadedExportStore.instance.list());

    toTreeItem(): TreeItem | Promise<TreeItem> {
        return {
            label: '已下载备份',
            iconPath: new ThemeIcon('archive'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: 'cnblogs-export-downloaded-entry',
        };
    }
}
