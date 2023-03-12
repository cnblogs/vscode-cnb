import { BlogExportRecord, BlogExportStatus, blogExportStatusNameMap } from '@/models/blog-export';
import { BaseEntryTreeItem } from '@/tree-view-providers/models/base-entry-tree-item';
import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source';
import { BlogExportRecordMetadata } from './record-metadata';
import { parseStatusIcon } from './parser';
import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';

export class BlogExportRecordTreeItem
    extends BaseTreeItemSource
    implements BaseEntryTreeItem<BlogExportRecordMetadata>
{
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
            iconPath: parseStatusIcon(status),
        });
    }

    getChildren: () => BlogExportRecordMetadata[] = () => {
        throw new Error('Not implement');
    };

    getChildrenAsync: () => Promise<BlogExportRecordMetadata[]> = () => Promise.resolve(this.parseMetadata());

    private parseMetadata(): BlogExportRecordMetadata[] {
        const {
            record,
            record: { status, id, fileBytes, dateExported },
        } = this;
        const items = [
            new BlogExportRecordMetadata(
                this,
                id,
                `状态: ${blogExportStatusNameMap[status]}`,
                undefined,
                new ThemeIcon('zap')
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
                'symbol-value'
            ),
            new BlogExportRecordMetadata(this, id, `文件大小: ${fileBytes}`),
            new BlogExportRecordMetadata(
                this,
                record.id,
                `创建时间: ${record.dateAdded}`,
                undefined,
                new ThemeIcon('vscode-cnb-date')
            ),
            ...(dateExported
                ? [
                      new BlogExportRecordMetadata(
                          this,
                          id,
                          `完成时间: ${dateExported}`,
                          undefined,
                          new ThemeIcon('vscode-cnb-date')
                      ),
                  ]
                : []),
        ];

        return items;
    }
}
