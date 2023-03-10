import { RefreshExportRecordsCommandHandler } from './refresh';
import { globalContext } from '@/services/global-state';
import { commands, Disposable } from 'vscode';

export function registerCommandsForBlogExport(disposables: Disposable[]) {
    const { extensionName } = globalContext;
    disposables.push(
        commands.registerCommand(`${extensionName}.blog-export.refresh-records`, () =>
            new RefreshExportRecordsCommandHandler().handle()
        )
    );
}
