import { BlogExportRecordsStore } from '@/services/blog-export-records.store';
import {
    BlogExportRecordTreeItem,
    BlogExportRecordMetadata,
    BlogExportTreeItem,
    parseBlogExportRecordEntries,
} from './models/blog-export';
import {
    DownloadedExportMetadata,
    DownloadedExportsEntryTreeItem,
    DownloadedExportTreeItem,
    ExportPostsEntry,
} from '@/tree-view-providers/models/blog-export/downloaded';
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { ExportPostTreeItem } from '@/tree-view-providers/models/blog-export/post';

export class BlogExportProvider implements TreeDataProvider<BlogExportTreeItem> {
    private static _instance?: BlogExportProvider | null;

    private _treeDataChangedSource?: EventEmitter<BlogExportTreeItem | null | undefined> | null;
    private _store?: BlogExportRecordsStore | null;
    private _shouldRefresh = false;
    private _downloadedExportEntry?: DownloadedExportsEntryTreeItem | null;

    static get instance(): BlogExportProvider {
        return (this._instance ??= new BlogExportProvider());
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
        if (element instanceof BlogExportRecordTreeItem) {
            return element.getChildrenAsync();
        } else if (element instanceof DownloadedExportsEntryTreeItem) {
            return element.getChildrenAsync();
        } else if (element instanceof DownloadedExportTreeItem) {
            return element.getChildrenAsync();
        } else if (element instanceof ExportPostsEntry) {
            return element.getChildrenAsync();
        } else if (element == null) {
            return this.listRecords().then(records => [
                (this._downloadedExportEntry = new DownloadedExportsEntryTreeItem()),
                ...records,
            ]);
        }

        return null;
    }

    getParent(element: BlogExportTreeItem): ProviderResult<BlogExportTreeItem> {
        if (
            element instanceof BlogExportRecordMetadata ||
            element instanceof DownloadedExportMetadata ||
            element instanceof DownloadedExportTreeItem ||
            element instanceof ExportPostTreeItem
        )
            return element.parent;

        return null;
    }

    refreshDownloadedExports() {
        if (this._downloadedExportEntry) this._treeDataChangedSource?.fire(this._downloadedExportEntry);
        return Promise.resolve();
    }

    async refreshRecords() {
        await this._store?.refresh();
        this._treeDataChangedSource?.fire(null);
    }

    private listRecords() {
        return this.store
            .list({ shouldRefresh: this._shouldRefresh })
            .then(x => parseBlogExportRecordEntries(x.items))
            .finally(() => (this._shouldRefresh = false));
    }
}
