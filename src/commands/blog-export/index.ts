import { RefreshExportRecordsCommandHandler } from './refresh'
import { globalCtx } from '@/services/global-state'
import { commands, Disposable } from 'vscode'
import { OpenLocalExportCommandHandler } from '@/commands/blog-export/open-local'
import { EditExportPostCommandHandler } from '@/commands/blog-export/edit'
import { CreateBlogExportCommandHandler } from '@/commands/blog-export/create'
import { DownloadExportCommandHandler } from '@/commands/blog-export/download'
import { ViewPostCommandHandler } from '@/commands/blog-export/view-post'
import { DeleteCommandHandler } from '@/commands/blog-export/delete'

export function registerCommandsForBlogExport(disposables: Disposable[]) {
    const { extensionName } = globalCtx
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
        ),
        commands.registerCommand(DownloadExportCommandHandler.commandName, input =>
            new DownloadExportCommandHandler(input).handle()
        ),
        commands.registerCommand(ViewPostCommandHandler.commandName, input =>
            new ViewPostCommandHandler(input).handle()
        ),
        commands.registerCommand(DeleteCommandHandler.commandName, input => new DeleteCommandHandler(input).handle())
    )
}
