import { CmdHandler } from '@/commands/cmd-handler'
import { execCmd } from '@/utils/cmd'
import { globalCtx } from '@/services/global-ctx'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { commands } from 'vscode'

export class RefreshExportRecordsCmdHandler extends CmdHandler {
    async handle(): Promise<void> {
        await this.setIsRefreshing(true)

        await BlogExportProvider.instance.refreshRecords()

        await this.setIsRefreshing(false)
    }

    private setIsRefreshing(value: boolean) {
        return execCmd('setContext', `${globalCtx.extName}.blog-export.records.isRefreshing`, value || undefined)
    }
}
