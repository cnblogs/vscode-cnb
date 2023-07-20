import { BlogExportRecord, BlogExportStatus, blogExportStatusNameMap } from '@/models/blog-export'
import { BlogExportApi } from '@/services/blog-export.api'
import { DownloadedExportStore } from '@/services/downloaded-export.store'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { BaseEntryTreeItem } from '@/tree-view-providers/models/base-entry-tree-item'
import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source'
import { BlogExportTreeItem, DownloadedExportTreeItem } from '@/tree-view-providers/models/blog-export'
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import { escapeRegExp } from 'lodash-es'
import os from 'os'
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode'
import { parseStatusIcon } from './parser'
import { BlogExportRecordMetadata } from './record-metadata'

export class BlogExportRecordTreeItem extends BaseTreeItemSource implements BaseEntryTreeItem<BlogExportTreeItem> {
    static readonly contextValue = 'cnblogs-export-record'

    private _downloadingProgress?: {
        percentage?: number
        transferred?: number
        total?: number
        message?: string | null
    } | null

    constructor(private readonly _treeDataProvider: BlogExportProvider, public record: BlogExportRecord) {
        super()
    }

    toTreeItem(): Promise<TreeItem> {
        const {
            record: { fileName, status },
        } = this
        const hasDone = status === BlogExportStatus.done
        const hasFailed = status === BlogExportStatus.failed

        return Promise.resolve({
            label: fileName,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: `${BlogExportRecordTreeItem.contextValue}-${BlogExportStatus[status]}`,
            iconPath: hasDone ? new ThemeIcon('cloud') : parseStatusIcon(status),
        }).finally(() => {
            if (!hasDone && !hasFailed) this.pollingStatus()
        })
    }

    getChildren: () => BlogExportTreeItem[] = () => {
        throw new Error('Not implement')
    }

    getChildrenAsync: () => Promise<BlogExportTreeItem[]> = () => Promise.resolve(this.parseChildren())

    reportDownloadingProgress(progress?: Partial<typeof this._downloadingProgress> | null) {
        this._downloadingProgress = progress ? Object.assign({}, this._downloadingProgress ?? {}, progress ?? {}) : null
    }

    private pollingStatus() {
        const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId)
            BlogExportApi.getById(this.record.id)
                .then(record => {
                    this.record = record
                })
                .catch(console.warn)
                .finally(() => this._treeDataProvider.refreshItem(this))
        }, 1500)
    }

    private async parseChildren(): Promise<BlogExportTreeItem[]> {
        const { filesize } = await import('filesize')
        const {
            record,
            record: { status, id, fileBytes, dateExported },
            _downloadingProgress,
        } = this
        const formattedFileSize = filesize(fileBytes)
        const dateTimeFormat = 'yyyy MM-dd HH:mm'
        const localExport = await DownloadedExportStore.findById(id)
        const items = [
            new BlogExportRecordMetadata(
                this,
                id,
                `状态: ${blogExportStatusNameMap[status]}`,
                undefined,
                parseStatusIcon(status)
            ),
            new BlogExportRecordMetadata(
                this,
                id,
                `博文数量: ${
                    status === BlogExportStatus.done
                        ? record.postCount
                        : `${record.exportedPostCount}/${record.postCount}`
                }`,
                undefined,
                new ThemeIcon('layers')
            ),
            new BlogExportRecordMetadata(
                this,
                id,
                `文件大小: ${typeof formattedFileSize === 'string' ? formattedFileSize : fileBytes}`,
                undefined,
                new ThemeIcon('symbol-unit')
            ),
            new BlogExportRecordMetadata(
                this,
                record.id,
                `创建时间: ${format(parseISO(record.dateAdded), dateTimeFormat)}`,
                undefined,
                new ThemeIcon('vscode-cnb-date')
            ),
            ...(dateExported
                ? [
                      new BlogExportRecordMetadata(
                          this,
                          id,
                          `完成时间: ${format(parseISO(dateExported), dateTimeFormat)}`,
                          undefined,
                          new ThemeIcon('vscode-cnb-date')
                      ),
                  ]
                : []),
            ...(localExport && !_downloadingProgress
                ? [
                      new DownloadedExportTreeItem(this, localExport, {
                          label: `本地文件: ${localExport.filePath.replace(
                              new RegExp('^' + escapeRegExp(os.homedir())),
                              '~'
                          )}`,
                      }),
                  ]
                : []),
            ...(_downloadingProgress
                ? [
                      new BlogExportRecordMetadata(
                          this,
                          id,
                          `${this.formatDownloadProgress(filesize)}`,
                          undefined,
                          new ThemeIcon('sync~spin')
                      ),
                  ]
                : []),
        ]

        return items
    }

    private formatDownloadProgress(filesize: typeof import('filesize').filesize): string {
        const { _downloadingProgress } = this
        if (_downloadingProgress == null) return ''
        let { transferred, total, percentage, message } = _downloadingProgress
        transferred ??= 0
        total ??= 0
        percentage ??= 0
        let formattedTransfer = filesize(transferred)
        formattedTransfer = typeof formattedTransfer === 'string' ? formattedTransfer : transferred

        let formattedTotal = filesize(total)
        formattedTotal = typeof formattedTotal === 'string' ? formattedTotal : total
        message ??= '下载中'
        return `${message}: ${formattedTransfer}/${formattedTotal} (${percentage}%)`
    }
}
