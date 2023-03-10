import { BlogExportRecord, BlogExportStatus } from '@/models/blog-export';
import { BlogExportRecordsEntryTreeItem } from './blog-export-records-entry';
import { ThemeColor, ThemeIcon } from 'vscode';

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

export function parseBlogExportRecordEntries(items: BlogExportRecord[]) {
    return items.map(i => new BlogExportRecordsEntryTreeItem(i));
}
