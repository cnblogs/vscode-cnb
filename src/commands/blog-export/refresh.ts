import { CommandHandler } from '@/commands/command-handler';
import { AlertService } from '@/services/alert.service';
import { globalContext } from '@/services/global-state';
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider';
import { isObject, isString } from 'lodash-es';
import { commands } from 'vscode';

export class RefreshExportRecordsCommandHandler extends CommandHandler {
    async handle(): Promise<void> {
        await this.setIsRefreshing(true);

        const succeed = await BlogExportProvider.instance
            .refreshRecords()
            .then(() => true)
            .catch(e => (isObject(e) || isString(e) ? e : false));

        if (succeed !== true)
            AlertService.warning(`刷新博客备份记录失败, ${succeed === false ? '未知错误' : succeed.toString()}`);

        await this.setIsRefreshing(false);
    }

    private setIsRefreshing(value: boolean) {
        return commands.executeCommand(
            'setContext',
            `${globalContext.extensionName}.blog-export.records.isRefreshing`,
            value || undefined
        );
    }
}
