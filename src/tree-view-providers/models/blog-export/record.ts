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

export class BlogExportRecordTreeItem extends BaseTreeItemSource implements BaseEntryTreeItem<BlogExportTreeItem> {
    static readonly contextValue = 'cnb-blog-export-record';

    constructor(public readonly record: BlogExportRecord) {
        super();
    }

    toTreeItem(): Promise<TreeItem> {
        const {
            record: { fileName, status },
        } = this;

        return Promise.resolve({
            label: fileName,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: `${BlogExportRecordTreeItem.contextValue}-${BlogExportStatus[status]}`,
            iconPath: new ThemeIcon('cloud'),
        });
    }

    getChildren: () => BlogExportTreeItem[] = () => {
        throw new Error('Not implement');
    };

    getChildrenAsync: () => Promise<BlogExportTreeItem[]> = () => Promise.resolve(this.parseChildren());

    private async parseChildren(): Promise<BlogExportTreeItem[]> {
        const { filesize } = await import('filesize');
        const {
            record,
            record: { status, id, fileBytes, dateExported },
        } = this;
        const formattedFileSize = filesize(fileBytes);
        const dateTimeFormat = 'yyyy MM-dd HH:mm';
        const localExport = DownloadedExportStore.instance.findById(id);
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
            ...(localExport
                ? [
                      new DownloadedExportTreeItem(this, localExport, {
                          label: `本地文件: ${localExport.filePath.replace(
                              new RegExp('^' + escapeRegExp(os.homedir())),
                              '~'
                          )}`,
                      }),
                  ]
                : []),
        ];

        return items;
    }
}
