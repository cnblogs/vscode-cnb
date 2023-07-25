import { DownloadedBlogExport } from '@/model/blog-export'
import { Alert } from '@/infra/alert'
import { BlogExportApi } from '@/service/blog-export.api'
import { DownloadedExportStore } from '@/service/downloaded-export.store'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { BlogExportRecordTreeItem, DownloadedExportTreeItem } from '@/tree-view/model/blog-export'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { window } from 'vscode'

function parseInput(input: unknown): DownloadedExportTreeItem | BlogExportRecordTreeItem | null | undefined {
    return input instanceof DownloadedExportTreeItem || input instanceof BlogExportRecordTreeItem ? input : null
}

export async function deleteBlogExport(input: unknown): Promise<void> {
    const parsedInput = parseInput(input)
    if (parsedInput instanceof DownloadedExportTreeItem) await deleteDownloadedExportItem(parsedInput)
    if (parsedInput instanceof BlogExportRecordTreeItem) await deleteExportRecordItem(parsedInput)
}

function confirm(
    itemName: string,
    hasLocalFile = true,
    detail: string | undefined | null = '数据可能无法恢复, 请谨慎操作!'
): Thenable<null | { shouldDeleteLocal: boolean } | undefined> {
    const options = [
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

async function deleteDownloadedExportItem(
    item: DownloadedExportTreeItem,
    { hasConfirmed = false } = {}
): Promise<void> {
    const result = hasConfirmed
        ? { shouldDeleteLocal: true }
        : await confirm(`博客备份-${path.basename(item.downloadedExport.filePath)}`, false, '删除后备份文件无法恢复')
    if (result == null) return

    await removeDownloadedBlogExport(item.downloadedExport, { shouldDeleteLocal: true })

    await BlogExportProvider.optionalInstance?.refreshRecords({ force: false })
    await BlogExportProvider.optionalInstance?.refreshDownloadedExports()
}

async function deleteExportRecordItem(item: BlogExportRecordTreeItem) {
    const { record } = item
    const downloaded = await DownloadedExportStore.findById(record.id)

    const confirmResult = await confirm(`云端博客备份-${record.fileName}`, downloaded != null, '删除后备份无法恢复')
    if (confirmResult == null) return

    const { shouldDeleteLocal } = confirmResult
    const hasDeleted = await BlogExportApi.del(record.id)
        .then(() => true)
        .catch((e: unknown) => {
            Alert.httpErr(typeof e === 'object' && e != null ? e : {})
            return false
        })
    if (hasDeleted) if (downloaded) await removeDownloadedBlogExport(downloaded, { shouldDeleteLocal })

    await BlogExportProvider.optionalInstance?.refreshRecords()
}

async function removeDownloadedBlogExport(downloaded: DownloadedBlogExport, { shouldDeleteLocal = false }) {
    await DownloadedExportStore.remove(downloaded, { shouldRemoveExportRecordMap: shouldDeleteLocal }).catch(
        console.warn
    )
    if (shouldDeleteLocal) await promisify(fs.rm)(downloaded.filePath).catch(console.warn)
}
