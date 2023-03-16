import { DownloadedBlogExport } from '@/models/blog-export';
import { DownloadedExportStore } from '@/services/downloaded-export.store';
import { BaseEntryTreeItem } from '@/tree-view-providers/models/base-entry-tree-item';
import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source';
import { BlogExportTreeItem } from '@/tree-view-providers/models/blog-export';
import { parseDownloadedExports } from '@/tree-view-providers/models/blog-export/parser';
import { ExportPostTreeItem } from '@/tree-view-providers/models/blog-export/post';
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item';
import path from 'path';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode';

export type DownloadedExportChildTreeItem =
    | PostTreeItem<DownloadedExportTreeItem>
    | TreeItem
    | ExportPostsEntryTreeItem;

export class DownloadedExportMetadata extends TreeItem {
    readonly parent?: DownloadedExportTreeItem | null;

    static parse(
        options: Partial<DownloadedExportMetadata> & Required<Pick<DownloadedExportMetadata, 'parent' | 'label'>>
    ) {
        return Object.assign(new DownloadedExportMetadata(''), options);
    }
}

export class ExportPostsEntryTreeItem extends BaseTreeItemSource implements BaseEntryTreeItem<ExportPostTreeItem> {
    constructor(public readonly parent: BlogExportTreeItem, public readonly downloadedExport: DownloadedBlogExport) {
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
        public readonly parent: BlogExportTreeItem,
        public readonly downloadedExport: DownloadedBlogExport,
        private readonly _uiOptions: Partial<TreeItem> = {}
    ) {
        super();
    }

    getChildren: () => DownloadedExportChildTreeItem[] = () => {
        throw new Error('Not implemented');
    };

    getChildrenAsync: () => Promise<DownloadedExportChildTreeItem[]> = () =>
        Promise.resolve([new ExportPostsEntryTreeItem(this, this.downloadedExport)]);

    toTreeItem(): TreeItem | Promise<TreeItem> {
        const {
            downloadedExport: { filePath },
        } = this;

        return Object.assign(
            new TreeItem(path.basename(filePath), TreeItemCollapsibleState.Collapsed),
            {
                iconPath: new ThemeIcon('database'),
                contextValue: 'cnblogs-export-downloaded',
            },
            this._uiOptions
        );
    }
}

export class DownloadedExportsEntryTreeItem
    extends BaseTreeItemSource
    implements BaseEntryTreeItem<DownloadedExportTreeItem>
{
    private _children?: DownloadedExportTreeItem[] | null;

    getChildren: () => DownloadedExportTreeItem[] = () => {
        throw new Error('Not implemented');
    };

    getChildrenAsync: () => Promise<DownloadedExportTreeItem[]> = async () =>
        (this._children ??= parseDownloadedExports(this, await DownloadedExportStore.instance.list()));

    async refresh() {
        this._children = null;
        await this.getChildrenAsync();
    }

    toTreeItem(): TreeItem | Promise<TreeItem> {
        return {
            label: '已下载备份',
            iconPath: new ThemeIcon('archive'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: 'cnblogs-export-downloaded-entry',
        };
    }
}
