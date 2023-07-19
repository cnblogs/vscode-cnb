import { CommandHandler } from '@/commands/command-handler'
import { globalCtx } from '@/services/global-state'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { commands } from 'vscode'

export class RefreshExportRecordsCommandHandler extends CommandHandler {
    async handle(): Promise<void> {
        await this.setIsRefreshing(true)

        await BlogExportProvider.instance.refreshRecords()

        await this.setIsRefreshing(false)
    }

    private setIsRefreshing(value: boolean) {
        return commands.executeCommand(
            'setContext',
            `${globalCtx.extensionName}.blog-export.records.isRefreshing`,
            value || undefined
        )
    }
}
