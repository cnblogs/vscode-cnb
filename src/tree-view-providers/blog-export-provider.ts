import { BlogExportRecordsStore } from '@/services/blog-export-records.store'
import {
    BlogExportRecordTreeItem,
    BlogExportRecordMetadata,
    BlogExportTreeItem,
    parseBlogExportRecords,
} from './models/blog-export'
import {
    DownloadedExportMetadata,
    DownloadedExportsEntryTreeItem,
    DownloadedExportTreeItem,
    ExportPostEntryTreeItem,
} from './models/blog-export/downloaded'
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { Alert } from '@/services/alert'
import { BlogExportRecord } from '@/models/blog-export'

export class BlogExportProvider implements TreeDataProvider<BlogExportTreeItem> {
    private static _instance: BlogExportProvider | null = null

    private _treeDataChangedSource?: EventEmitter<BlogExportTreeItem | null | undefined> | null
    private _store?: BlogExportRecordsStore | null
    private _downloadedExportEntry?: DownloadedExportsEntryTreeItem | null

    static get instance(): BlogExportProvider {
        this._instance ??= new BlogExportProvider()
        return this._instance
    }

    static get optionalInstance(): BlogExportProvider | undefined | null {
        return this._instance
    }

    get onDidChangeTreeData(): Event<BlogExportTreeItem | null | undefined> {
        this._treeDataChangedSource ??= new EventEmitter<BlogExportTreeItem | null | undefined>()
        return this._treeDataChangedSource.event
    }

    get store(): BlogExportRecordsStore {
        this._store ??= new BlogExportRecordsStore()
        return this._store
    }

    getTreeItem(element: BlogExportTreeItem): TreeItem | Thenable<TreeItem> {
        return element instanceof TreeItem ? element : element.toTreeItem()
    }

    getChildren(element?: BlogExportTreeItem | null): ProviderResult<BlogExportTreeItem[]> {
        if (element instanceof BlogExportRecordTreeItem) return element.getChildrenAsync()
        else if (element instanceof DownloadedExportsEntryTreeItem) return element.getChildrenAsync()
        else if (element instanceof DownloadedExportTreeItem) return element.getChildrenAsync()
        else if (element instanceof ExportPostEntryTreeItem) return element.getChildrenAsync()
        else if (element == null)
            return [(this._downloadedExportEntry = new DownloadedExportsEntryTreeItem()), ...this.listRecords()]

        return null
    }

    getParent(element: BlogExportTreeItem): ProviderResult<BlogExportTreeItem> {
        if (
            element instanceof BlogExportRecordMetadata ||
            element instanceof DownloadedExportMetadata ||
            element instanceof DownloadedExportTreeItem ||
            element instanceof ExportPostEntryTreeItem
        )
            return element.parent

        return null
    }

    async refreshDownloadedExports({ force = true } = {}) {
        if (this._downloadedExportEntry) {
            const hasCacheRefreshed = force
                ? await this._downloadedExportEntry.refresh().then(
                      () => true,
                      () => false
                  )
                : true
            if (hasCacheRefreshed) this._treeDataChangedSource?.fire(this._downloadedExportEntry)

            return hasCacheRefreshed
        }

        return false
    }

    /**
     * Refresh the records of blog-export
     * @param options
     * @returns The boolean value which tell if the data has been refreshed
     */
    async refreshRecords({
        /**
         * Tell if to raise notify to the user when error response received during the refreshing process
         */
        notifyOnError = true,
        /**
         * Tell should reload the cached data
         */
        force = true,
        /**
         * Tell should remove the cached data
         * **NOTE** only works with `force=false`, when `force=true`, the cached data will always be removed and the re-created
         */
        clearCache = true,
    } = {}): Promise<boolean> {
        const hasCacheRefreshed = force
            ? await this._store
                  ?.refresh()
                  .then(() => true)
                  .catch(e => {
                      if (notifyOnError) Alert.err(`刷新博客备份记录失败: ${e.message}`)
                  })
            : clearCache
            ? await this._store?.clearCache().then(
                  () => true,
                  () => true
              )
            : true

        if (hasCacheRefreshed) this._treeDataChangedSource?.fire(null)

        return hasCacheRefreshed ?? false
    }

    refreshItem<T extends BlogExportTreeItem>(item: T) {
        this._treeDataChangedSource?.fire(item)
    }

    private listRecords(): BlogExportRecordTreeItem[] {
        const {
            store: { cached },
        } = this
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        if (cached == null) void this.refreshRecords()
        const items: BlogExportRecord[] = cached?.items ?? []
        return parseBlogExportRecords(this, items)
    }
}
