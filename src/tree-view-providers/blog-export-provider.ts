import { BlogExportRecordsStore } from '@/services/blog-export-records.store';
import {
    BlogExportRecordsEntryTreeItem,
    BlogExportRecordMetadata,
    BlogExportTreeItem,
    parseBlogExportRecordEntries,
} from '@/tree-view-providers/models/blog-export';
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';

export class BlogExportProvider implements TreeDataProvider<BlogExportTreeItem> {
    private static _instance?: BlogExportProvider | null;

    private _treeDataChangedSource?: EventEmitter<BlogExportTreeItem | null | undefined> | null;
    private _store?: BlogExportRecordsStore | null;
    private _shouldRefresh = false;

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
        return element.toTreeItem();
    }

    getChildren(element?: BlogExportTreeItem | undefined): ProviderResult<BlogExportTreeItem[]> {
        if (element instanceof BlogExportRecordsEntryTreeItem) return element.getChildrenAsync();
        else if (element == null) return this.listRecords();

        return null;
    }

    getParent(element: BlogExportTreeItem): ProviderResult<BlogExportTreeItem> {
        if (element instanceof BlogExportRecordMetadata) return element.parent;

        return null;
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
