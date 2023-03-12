import { RefreshExportRecordsCommandHandler } from './refresh';
import { globalContext } from '@/services/global-state';
import { commands, Disposable } from 'vscode';
import { OpenLocalExportCommandHandler } from '@/commands/blog-export/open-local';

export function registerCommandsForBlogExport(disposables: Disposable[]) {
    const { extensionName } = globalContext;
    disposables.push(
        commands.registerCommand(`${extensionName}.blog-export.refresh-records`, () =>
            new RefreshExportRecordsCommandHandler().handle()
        ),
        commands.registerCommand(OpenLocalExportCommandHandler.commandName, () =>
            new OpenLocalExportCommandHandler().handle()
        )
    );
}
