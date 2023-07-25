import { CmdHandler } from '@/cmd/cmd-handler'
import { execCmd } from '@/infra/cmd'
import { globalCtx } from '@/service/global-ctx'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { commands } from 'vscode'

export class RefreshExportRecordsCmdHandler implements CmdHandler {
    async handle(): Promise<void> {
        await this.setIsRefreshing(true)

        await BlogExportProvider.instance.refreshRecords()

        await this.setIsRefreshing(false)
    }

    private setIsRefreshing(value: boolean) {
        return execCmd('setContext', `${globalCtx.extName}.blog-export.records.isRefreshing`, value || undefined)
    }
}
