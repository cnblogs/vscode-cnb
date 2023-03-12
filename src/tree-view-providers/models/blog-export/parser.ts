import { BlogExportRecord, BlogExportStatus, DownloadedBlogExport } from '@/models/blog-export';
import { BlogExportRecordTreeItem } from './record';
import { ThemeColor, ThemeIcon } from 'vscode';
import {
    DownloadedExportsEntryTreeItem,
    DownloadedExportTreeItem,
} from '@/tree-view-providers/models/blog-export/downloaded';

export function parseStatusIcon(status: BlogExportStatus) {
    switch (status) {
        case BlogExportStatus.done:
            return new ThemeIcon('pass', new ThemeColor('testing.iconPassed'));
        case BlogExportStatus.failed:
            return new ThemeIcon('error', new ThemeColor('errorForeground'));
        case BlogExportStatus.created:
            return new ThemeIcon('circle-large-outline');
        default:
            return new ThemeIcon('sync~spin');
    }
}

export function parseBlogExportRecords(items: BlogExportRecord[]) {
    return items.map(i => new BlogExportRecordTreeItem(i));
}

export function parseDownloadedExports(
    parent: DownloadedExportsEntryTreeItem,
    items: DownloadedBlogExport[]
): DownloadedExportTreeItem[] {
    return items.map<DownloadedExportTreeItem>(i => new DownloadedExportTreeItem(parent, i));
}
