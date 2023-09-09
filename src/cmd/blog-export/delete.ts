import { DownloadedBlogExport } from '@/model/blog-export'
import { Alert } from '@/infra/alert'
import { BlogExportApi } from '@/service/blog-export/blog-export'
import { DownloadedExportStore } from '@/service/downloaded-export.store'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { BlogExportRecordTreeItem, DownloadedExportTreeItem } from '@/tree-view/model/blog-export'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

export async function deleteBlogExport(treeItem?: DownloadedExportTreeItem | BlogExportRecordTreeItem): Promise<void> {
    if (treeItem instanceof DownloadedExportTreeItem) await deleteDownloadedExportItem(treeItem)
    if (treeItem instanceof BlogExportRecordTreeItem) await deleteExportRecordItem(treeItem)
}

async function confirm(itemName: string, hasLocalFile = true, detail: string) {
    const options = [
        { title: '确定' + (hasLocalFile ? '(保留本地文件)' : ''), result: { shouldDeleteLocal: false } },
        ...(hasLocalFile ? [{ title: '确定(同时删除本地文件)', result: { shouldDeleteLocal: true } }] : []),
    ]
    const x = await Alert.info(`确定要删除 ${itemName} 吗?`, { modal: true, detail }, ...options)
    return x?.result
}

async function deleteDownloadedExportItem(
    item: DownloadedExportTreeItem,
    { hasConfirmed = false } = {}
): Promise<void> {
    const result = hasConfirmed
        ? { shouldDeleteLocal: true }
        : await confirm(`博客备份-${path.basename(item.downloadedExport.filePath)}`, false, '删除后备份文件无法恢复')
    if (result === undefined) return

    await removeDownloadedBlogExport(item.downloadedExport, { shouldDeleteLocal: true })

    await BlogExportProvider.optionalInstance?.refreshRecords({ force: false })
    await BlogExportProvider.optionalInstance?.refreshDownloadedExports()
}

async function deleteExportRecordItem(item: BlogExportRecordTreeItem) {
    const { record } = item
    const downloaded = await DownloadedExportStore.findById(record.id)

    const confirmResult = await confirm(`云端博客备份-${record.fileName}`, downloaded != null, '删除后备份无法恢复')
    if (confirmResult === undefined) return

    const { shouldDeleteLocal } = confirmResult
    const hasDeleted = await BlogExportApi.del(record.id)
        .then(() => true)
        .catch(e => {
            void Alert.err(`删除博客备份失败: ${<string>e}`)
            return false
        })
    if (hasDeleted) if (downloaded !== undefined) await removeDownloadedBlogExport(downloaded, { shouldDeleteLocal })

    await BlogExportProvider.optionalInstance?.refreshRecords()
}

async function removeDownloadedBlogExport(downloaded: DownloadedBlogExport, { shouldDeleteLocal = false }) {
    await DownloadedExportStore.remove(downloaded, { shouldRemoveExportRecordMap: shouldDeleteLocal })
    if (shouldDeleteLocal) await promisify(fs.rm)(downloaded.filePath)
}
