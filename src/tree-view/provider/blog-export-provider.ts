import { BlogExportRecordsStore } from '@/service/blog-export/blog-export-records.store'
import {
    BlogExportRecordTreeItem,
    BlogExportRecordMetadata,
    BlogExportTreeItem,
    parseBlogExportRecords,
} from '@/tree-view/model/blog-export'
import {
    DownloadedExportMetadata,
    DownloadedExportsEntryTreeItem,
    DownloadedExportTreeItem,
    ExportPostEntryTreeItem,
} from '@/tree-view/model/blog-export'
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { Alert } from '@/infra/alert'
import { BlogExportRecord } from '@/model/blog-export'
import { UserService } from '@/service/user.service'

export class BlogExportProvider implements TreeDataProvider<BlogExportTreeItem> {
    private static _instance: BlogExportProvider | null = null

    private _treeDataChangedSource?: EventEmitter<BlogExportTreeItem | null | undefined> | null
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

    getTreeItem(el: BlogExportTreeItem): TreeItem | Thenable<TreeItem> {
        return el instanceof TreeItem ? el : el.toTreeItem()
    }

    getChildren(el?: BlogExportTreeItem | null): ProviderResult<BlogExportTreeItem[]> {
        if (
            el instanceof BlogExportRecordTreeItem ||
            el instanceof DownloadedExportsEntryTreeItem ||
            el instanceof ExportPostEntryTreeItem ||
            el instanceof DownloadedExportTreeItem
        ) {
            // @ts-ignore
            return el.getChildrenAsync()
        }

        if (el == null)
            return [(this._downloadedExportEntry = new DownloadedExportsEntryTreeItem()), ...this.listRecords()]

        return null
    }

    getParent(el: BlogExportTreeItem): ProviderResult<BlogExportTreeItem> {
        if (
            el instanceof BlogExportRecordMetadata ||
            el instanceof DownloadedExportMetadata ||
            el instanceof DownloadedExportTreeItem ||
            el instanceof ExportPostEntryTreeItem
        )
            return el.parent

        return null
    }

    async refreshDownloadedExports({ force = true } = {}) {
        const entry = this._downloadedExportEntry
        if (entry !== null && entry !== undefined) {
            const hasCacheRefreshed = force
                ? await entry.refresh().then(
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
        // TODO: need refactor
        const hasCacheRefreshed = force
            ? await BlogExportRecordsStore?.refresh()
                .then(() => true)
                .catch(async e => {
                    if (notifyOnError && (await UserService.hasBlog()))
                        void Alert.err(`刷新备份记录失败: ${e as string}`)
                    return false
                })
            : clearCache
                ? await BlogExportRecordsStore.clearCache().then(
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
        const cached = BlogExportRecordsStore.getCached()
        if (cached == null) void this.refreshRecords()
        const items: BlogExportRecord[] = cached?.items ?? []
        return parseBlogExportRecords(this, items)
    }
}
