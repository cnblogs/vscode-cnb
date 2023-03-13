import { CommandHandler } from '@/commands/command-handler';
import { window } from 'vscode';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { AlertService } from '@/services/alert.service';
import { DownloadedExportStore } from '@/services/downloaded-export.store';
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider';

const defaultOptions = { confirmUnzip: true };

export class OpenLocalExportCommandHandler extends CommandHandler {
    static readonly commandName = `vscode-cnb.blog-export.open-local-export`;

    async handle(opts: Partial<typeof defaultOptions> = defaultOptions): Promise<void> {
        let isConfirmedToUnzip = opts?.confirmUnzip === true ? true : defaultOptions.confirmUnzip;

        const [fileUri] =
            (await window.showOpenDialog({
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Sqlite: ['db', 'zip'],
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    // ZipSqlite: ['zip'],
                },
            })) ?? [];
        if (fileUri == null) return;
        const filePath = fileUri.fsPath;
        if (filePath.endsWith('.zip') && !filePath.endsWith('.db.zip'))
            return AlertService.warning('不支持的博客备份文件');

        const fileName = path.basename(filePath.replace(/\.db(\.zip)?$/, ''));
        const dirname = path.dirname(filePath);
        let dbFilePath = filePath;
        isConfirmedToUnzip = filePath.endsWith('.db.zip');
        // if (!confirmUnzip && fileUri.fsPath.endsWith('db.zip')) {
        //     const options: (MessageItem & { confirmed: boolean })[] = [{ title: '确定', confirmed: true }];
        //     const selected = await window.showInformationMessage(
        //         '浏览博客备份需要解决, 确定要解压吗?',
        //         { modal: true },
        //         ...options
        //     );

        //     confirmUnzip = selected?.confirmed === true;
        // }

        if (isConfirmedToUnzip) {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const AdmZip = (await import('adm-zip')).default;
            const zip = new AdmZip(filePath);
            zip.extractEntryTo(`${fileName}.db`, dirname, false, true);
            dbFilePath = path.join(dirname, `${fileName}.db`);
        }
        const dbFileName = path.basename(dbFilePath);

        const isExist = await promisify(fs.exists)(dbFilePath);
        if (!isExist) return AlertService.warning('文件不存在');

        const treeProvider = BlogExportProvider.optionalInstance;
        const dbFileSize = (await promisify(fs.stat)(dbFilePath)).size;
        const exportRecord = await treeProvider?.store
            .list()
            .then(x => x.items.find(i => i.fileName === dbFileName && i.fileBytes === dbFileSize));
        await DownloadedExportStore.instance.add(dbFilePath, exportRecord?.id);

        await treeProvider?.refreshDownloadedExports();
    }
}
