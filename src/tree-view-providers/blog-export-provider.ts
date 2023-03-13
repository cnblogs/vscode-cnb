import { BlogExportRecordsStore } from '@/services/blog-export-records.store';
import {
    BlogExportRecordTreeItem,
    BlogExportRecordMetadata,
    BlogExportTreeItem,
    parseBlogExportRecords,
} from './models/blog-export';
import {
    DownloadedExportMetadata,
    DownloadedExportsEntryTreeItem,
    DownloadedExportTreeItem,
    ExportPostsEntryTreeItem,
} from '@/tree-view-providers/models/blog-export/downloaded';
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { ExportPostTreeItem } from '@/tree-view-providers/models/blog-export/post';
import { AlertService } from '@/services/alert.service';
import { BlogExportRecord } from '@/models/blog-export';

export class BlogExportProvider implements TreeDataProvider<BlogExportTreeItem> {
    private static _instance?: BlogExportProvider | null;

    private _treeDataChangedSource?: EventEmitter<BlogExportTreeItem | null | undefined> | null;
    private _store?: BlogExportRecordsStore | null;
    private _shouldRefresh = false;
    private _downloadedExportEntry?: DownloadedExportsEntryTreeItem | null;

    static get instance(): BlogExportProvider {
        return (this._instance ??= new BlogExportProvider());
    }

    static get optionalInstance(): BlogExportProvider | undefined | null {
        return this._instance;
    }

    get onDidChangeTreeData(): Event<BlogExportTreeItem | null | undefined> {
        return (this._treeDataChangedSource ??= new EventEmitter<BlogExportTreeItem | null | undefined>()).event;
    }

    get store(): BlogExportRecordsStore {
        return (this._store ??= new BlogExportRecordsStore());
    }

    getTreeItem(element: BlogExportTreeItem): TreeItem | Thenable<TreeItem> {
        return element instanceof TreeItem ? element : element.toTreeItem();
    }

    getChildren(element?: BlogExportTreeItem | null): ProviderResult<BlogExportTreeItem[]> {
        if (element instanceof BlogExportRecordTreeItem) return element.getChildrenAsync();
        else if (element instanceof DownloadedExportsEntryTreeItem) return element.getChildrenAsync();
        else if (element instanceof DownloadedExportTreeItem) return element.getChildrenAsync();
        else if (element instanceof ExportPostsEntryTreeItem) return element.getChildrenAsync();
        else if (element == null)
            return [(this._downloadedExportEntry = new DownloadedExportsEntryTreeItem()), ...this.listRecords()];

        return null;
    }

    getParent(element: BlogExportTreeItem): ProviderResult<BlogExportTreeItem> {
        if (
            element instanceof BlogExportRecordMetadata ||
            element instanceof DownloadedExportMetadata ||
            element instanceof DownloadedExportTreeItem ||
            element instanceof ExportPostTreeItem ||
            element instanceof ExportPostsEntryTreeItem
        )
            return element.parent;

        return null;
    }

    refreshDownloadedExports() {
        if (this._downloadedExportEntry) this._treeDataChangedSource?.fire(this._downloadedExportEntry);
        return Promise.resolve();
    }

    async refreshRecords({ notifyOnError = true } = {}): Promise<boolean> {
        const isSuccess = await this._store
            ?.refresh()
            .then(() => true)
            .catch(e => (notifyOnError ? void AlertService.warning(`刷新博客备份失败记录, ${e}`) : undefined));
        if (isSuccess) this._treeDataChangedSource?.fire(null);

        return isSuccess ?? false;
    }

    refreshItem<T extends BlogExportTreeItem>(item: T) {
        this._treeDataChangedSource?.fire(item);
    }

    private listRecords(): BlogExportRecordTreeItem[] {
        const {
            store: { cached },
        } = this;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        if (cached == null) this.refreshRecords();
        const items: BlogExportRecord[] = cached?.items ?? [];
        return parseBlogExportRecords(this, items);
    }
}
