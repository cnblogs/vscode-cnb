import { RefreshExportRecordsCommandHandler } from './refresh';
import { globalContext } from '@/services/global-state';
import { commands, Disposable } from 'vscode';
import { OpenLocalExportCommandHandler } from '@/commands/blog-export/open-local';
import { EditExportPostCommandHandler } from '@/commands/blog-export/edit';
import { CreateBlogExportCommandHandler } from '@/commands/blog-export/create';

export function registerCommandsForBlogExport(disposables: Disposable[]) {
    const { extensionName } = globalContext;
    disposables.push(
        commands.registerCommand(`${extensionName}.blog-export.refresh-records`, () =>
            new RefreshExportRecordsCommandHandler().handle()
        ),
        commands.registerCommand(OpenLocalExportCommandHandler.commandName, () =>
            new OpenLocalExportCommandHandler().handle()
        ),
        commands.registerCommand(EditExportPostCommandHandler.commandName, input =>
            new EditExportPostCommandHandler(input).handle()
        ),
        commands.registerCommand(CreateBlogExportCommandHandler.commandName, () =>
            new CreateBlogExportCommandHandler().handle()
        )
    );
}
