export enum BlogExportStatus {
    created = 0,
    exporting = 1,
    compressing = 2,
    done = 3,
    failed = 4,
}

export interface BlogExportRecordList {
    items: BlogExportRecord[];
    pageIndex: number;
    pageSize: number;
    totalCount: number;
}

export interface BlogExportRecord {
    id: number;
    blogId: number;
    fileName: string;
    archiveName?: string | null;
    fileBytes: number;
    archiveBytes: number;
    sha256Checksum?: string | null;
    exportedPostCount: number;
    postCount: number;
    status: BlogExportStatus;
    dateExported?: string | null;
    dateAdded: string;
}

export interface DownloadedBlogExport {
    filePath: string;
    id: number;
}

export const blogExportStatusNameMap: Record<BlogExportStatus, string> = {
    [BlogExportStatus.compressing]: '压缩中',
    [BlogExportStatus.exporting]: '导出中',
    [BlogExportStatus.created]: '排队中',
    [BlogExportStatus.done]: '已完成',
    [BlogExportStatus.failed]: '失败',
};
