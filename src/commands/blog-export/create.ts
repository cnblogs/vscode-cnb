import { CmdHandler } from '@/commands/cmd-handler'
import { AlertService } from '@/services/alert.service'
import { BlogExportApi } from '@/services/blog-export.api'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { MessageItem, window } from 'vscode'

export class CreateBlogExportCmdHandler extends CmdHandler {
    static readonly commandName = 'vscode-cnb.blog-export.create'

    async handle(): Promise<void> {
        if (!(await this.confirm())) return

        if (
            (await BlogExportApi.create().catch((e: unknown) => {
                AlertService.httpErr(typeof e === 'object' && e ? e : {}, { message: '创建博客备份失败' })
                return false
            })) !== false
        )
            await BlogExportProvider.optionalInstance?.refreshRecords()
    }

    private async confirm(): Promise<boolean> {
        const items: MessageItem[] = [{ title: '确定', isCloseAffordance: false }]
        const result = await AlertService.info(
            '确定要创建备份吗?',
            { modal: true, detail: '一天可以创建一次备份' },
            ...items
        )
        return result != null
    }
}
