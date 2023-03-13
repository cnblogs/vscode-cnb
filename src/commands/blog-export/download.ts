import { TreeViewCommandHandler } from '@/commands/command-handler';
import { AlertService } from '@/services/alert.service';
import { BlogExportApi } from '@/services/blog-export.api';
import { DownloadedExportStore } from '@/services/downloaded-export.store';
import { Settings } from '@/services/settings.service';
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider';
import { BlogExportRecordTreeItem } from '@/tree-view-providers/models/blog-export';
import { extensionViews } from '@/tree-view-providers/tree-view-registration';
import fs from 'fs';
import { Progress } from 'got';
import path from 'path';
import { promisify } from 'util';

export class DownloadExportCommandHandler extends TreeViewCommandHandler<BlogExportRecordTreeItem> {
    static readonly commandName = 'vscode-cnb.blog-export.download';

    private _exportApi?: BlogExportApi | null;

    constructor(public readonly input: unknown) {
        super();
    }

    protected get exportApi() {
        return (this._exportApi ??= new BlogExportApi());
    }

    parseInput(): BlogExportRecordTreeItem | null | undefined {
        return this.input instanceof BlogExportRecordTreeItem ? this.input : null;
    }

    async handle(): Promise<void> {
        const treeItem = this.parseInput();
        if (treeItem == null) return;
        const {
            record: { id: exportId, blogId },
        } = treeItem;

        if (blogId < 0 || exportId <= 0) return;

        const { exportApi } = this;
        const targetDir = path.join(Settings.workspaceUri.fsPath, '博客备份');
        await promisify(fs.mkdir)(targetDir, { recursive: true });
        const filePath = path.join(targetDir, treeItem.record.fileName);
        const downloadStream = exportApi.download(blogId, exportId);
        const isFileExist = await promisify(fs.exists)(filePath);
        const fileStream = fs.createWriteStream(filePath);

        extensionViews.blogExport.reveal(treeItem, { expand: true }).then(undefined, console.warn);

        const { optionalInstance: blogExportProvider } = BlogExportProvider;

        downloadStream
            .on('downloadProgress', ({ transferred, total, percent }: Progress) => {
                const percentage = Math.round(percent * 100);
                treeItem.reportDownloadingProgress({ percentage, transferred, total: total ?? transferred });
                blogExportProvider?.refreshItem(treeItem);
            })
            .on('error', e => {
                treeItem.reportDownloadingProgress(null);
                blogExportProvider?.refreshItem(treeItem);
                AlertService.warning('下载博客备份失败' + ', ' + e.toString());
                fileStream.close();
            });

        fileStream
            .on('error', error => AlertService.error(`写入文件 ${filePath} 时发生异常, ${error.message}`))
            .on('finish', () => {
                DownloadedExportStore.instance
                    .add(filePath, exportId)
                    .then(() => treeItem.reportDownloadingProgress(null))
                    .then(() => blogExportProvider?.refreshItem(treeItem))
                    .then(() => blogExportProvider?.refreshDownloadedExports())
                    .catch(console.warn);
                if (!isFileExist) fs.rmSync(filePath);
            });

        downloadStream.pipe(fileStream);
    }
}
