import { BlogExportRecord, BlogExportStatus, blogExportStatusNameMap } from '@/models/blog-export';
import { BaseEntryTreeItem } from '@/tree-view-providers/models/base-entry-tree-item';
import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source';
import { BlogExportRecordMetadata } from './record-metadata';
import { parseStatusIcon } from './parser';
import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import { DownloadedExportStore } from '@/services/downloaded-export.store';
import { BlogExportTreeItem, DownloadedExportTreeItem } from '@/tree-view-providers/models/blog-export';
import os from 'os';
import { escapeRegExp } from 'lodash-es';
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider';
import { BlogExportApi } from '@/services/blog-export.api';

export class BlogExportRecordTreeItem extends BaseTreeItemSource implements BaseEntryTreeItem<BlogExportTreeItem> {
    static readonly contextValue = 'cnblogs-export-record';
    private _blogExportApi?: BlogExportApi | null;
    private _downloadingProgress?: { percentage: number; transferred: number; total: number } | null;

    constructor(private readonly _treeDataProvider: BlogExportProvider, public record: BlogExportRecord) {
        super();
    }

    protected get blogExportApi() {
        return (this._blogExportApi ??= new BlogExportApi());
    }

    toTreeItem(): Promise<TreeItem> {
        const {
            record: { fileName, status },
        } = this;
        const hasDone = status === BlogExportStatus.done;
        const hasFailed = status === BlogExportStatus.failed;

        return Promise.resolve({
            label: fileName,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: `${BlogExportRecordTreeItem.contextValue}-${BlogExportStatus[status]}`,
            iconPath: hasDone ? new ThemeIcon('cloud') : parseStatusIcon(status),
        }).finally(() => {
            if (!hasDone && !hasFailed) this.pollingStatus();
        });
    }

    getChildren: () => BlogExportTreeItem[] = () => {
        throw new Error('Not implement');
    };

    getChildrenAsync: () => Promise<BlogExportTreeItem[]> = () => Promise.resolve(this.parseChildren());

    reportDownloadingProgress(progress?: typeof this._downloadingProgress | null) {
        this._downloadingProgress = progress;
    }

    private pollingStatus() {
        const { blogExportApi } = this;
        const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            blogExportApi
                .getById(this.record.id)
                .then(record => {
                    this.record = record;
                    this._treeDataProvider.refreshItem(this);
                })
                .catch(console.warn);
        }, 1500);
    }

    private async parseChildren(): Promise<BlogExportTreeItem[]> {
        const { filesize } = await import('filesize');
        const {
            record,
            record: { status, id, fileBytes, dateExported },
            _downloadingProgress,
        } = this;
        const formattedFileSize = filesize(fileBytes);
        const dateTimeFormat = 'yyyy MM-dd HH:mm';
        const localExport = await DownloadedExportStore.instance.findById(id);
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
                          `下载中: ${this.formatDownloadProgress(filesize)}`,
                          undefined,
                          new ThemeIcon('sync~spin')
                      ),
                  ]
                : []),
        ];

        return items;
    }

    private formatDownloadProgress(filesize: typeof import('filesize').filesize): string {
        const { _downloadingProgress } = this;
        if (_downloadingProgress == null) return '';

        let formattedTransfer = filesize(_downloadingProgress.transferred);
        formattedTransfer =
            typeof formattedTransfer === 'string' ? formattedTransfer : _downloadingProgress.transferred;

        let formattedTotal = filesize(_downloadingProgress.total);
        formattedTotal = typeof formattedTotal === 'string' ? formattedTotal : _downloadingProgress.total;

        return `${formattedTransfer}/${formattedTotal} (${_downloadingProgress.percentage}%)`;
    }
}
