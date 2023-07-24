import { TreeViewCmdHandler } from '@/commands/cmd-handler'
import { DownloadedBlogExport } from '@/models/blog-export'
import { Alert } from '@/services/alert.service'
import { BlogExportApi } from '@/services/blog-export.api'
import { DownloadedExportStore } from '@/services/downloaded-export.store'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { BlogExportRecordTreeItem, DownloadedExportTreeItem } from '@/tree-view-providers/models/blog-export'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { MessageItem, window } from 'vscode'

export class DeleteCmdHandler implements TreeViewCmdHandler<DownloadedExportTreeItem | BlogExportRecordTreeItem> {
    static readonly cmd = 'vscode-cnb.blog-export.delete'

    constructor(public input: unknown) {}

    parseInput(): DownloadedExportTreeItem | BlogExportRecordTreeItem | null | undefined {
        return this.input instanceof DownloadedExportTreeItem || this.input instanceof BlogExportRecordTreeItem
            ? this.input
            : null
    }

    async handle(): Promise<void> {
        const input = this.parseInput()
        if (input instanceof DownloadedExportTreeItem) await this.deleteDownloadedExportItem(input)
        if (input instanceof BlogExportRecordTreeItem) await this.deleteExportRecordItem(input)
    }

    private confirm(
        itemName: string,
        hasLocalFile = true,
        detail: string | undefined | null = '数据可能无法恢复, 请谨慎操作!'
    ): Thenable<null | { shouldDeleteLocal: boolean } | undefined> {
        const options: (MessageItem & {
            result: ReturnType<DeleteCmdHandler['confirm']> extends Thenable<infer R> ? R : never
        })[] = [
            { title: '确定' + (hasLocalFile ? '(保留本地文件)' : ''), result: { shouldDeleteLocal: false } },
            ...(hasLocalFile ? [{ title: '确定(同时删除本地文件)', result: { shouldDeleteLocal: true } }] : []),
        ]
        return window
            .showInformationMessage(
                `确定要删除 ${itemName} 吗?`,
                { modal: true, detail: detail ? detail : undefined },
                ...options
            )
            .then(
                x => x?.result,
                () => undefined
            )
    }

    private async deleteDownloadedExportItem(
        item: DownloadedExportTreeItem,
        { hasConfirmed = false } = {}
    ): Promise<void> {
        const result = hasConfirmed
            ? { shouldDeleteLocal: true }
            : await this.confirm(
                  `博客备份-${path.basename(item.downloadedExport.filePath)}`,
                  false,
                  '删除后备份文件无法恢复'
              )
        if (result == null) return

        await this.removeDownloadedBlogExport(item.downloadedExport, { shouldDeleteLocal: true })

        await BlogExportProvider.optionalInstance?.refreshRecords({ force: false })
        await BlogExportProvider.optionalInstance?.refreshDownloadedExports()
    }

    private async deleteExportRecordItem(item: BlogExportRecordTreeItem) {
        const { record } = item
        const downloaded = await DownloadedExportStore.findById(record.id)

        const confirmResult = await this.confirm(
            `云端博客备份-${record.fileName}`,
            downloaded != null,
            '删除后备份无法恢复'
        )
        if (confirmResult == null) return

        const { shouldDeleteLocal } = confirmResult
        const hasDeleted = await BlogExportApi.del(record.id)
            .then(() => true)
            .catch((e: unknown) => {
                Alert.httpErr(typeof e === 'object' && e != null ? e : {})
                return false
            })
        if (hasDeleted) if (downloaded) await this.removeDownloadedBlogExport(downloaded, { shouldDeleteLocal })

        await BlogExportProvider.optionalInstance?.refreshRecords()
    }

    private async removeDownloadedBlogExport(downloaded: DownloadedBlogExport, { shouldDeleteLocal = false }) {
        await DownloadedExportStore.remove(downloaded, { shouldRemoveExportRecordMap: shouldDeleteLocal }).catch(
            console.warn
        )
        if (shouldDeleteLocal) await promisify(fs.rm)(downloaded.filePath).catch(console.warn)
    }
}
