import { Alert } from '@/infra/alert'
import { BlogExportApi } from '@/service/blog-export/blog-export'
import { DownloadedExportStore } from '@/service/downloaded-export.store'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { BlogExportRecordTreeItem } from '@/tree-view/model/blog-export'
import { extTreeViews } from '@/tree-view/tree-view-register'
import fs from 'fs'
import { Progress } from 'got'
import path from 'path'
import { promisify } from 'util'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import AdmZip from 'adm-zip'
import { setCtx } from '@/ctx/global-ctx'
import { fsUtil } from '@/infra/fs/fsUtil'

export async function downloadBlogExport(treeItem?: BlogExportRecordTreeItem) {
    if (!(treeItem instanceof BlogExportRecordTreeItem)) return
    const exportId = treeItem.record.id
    const blogId = treeItem.record.blogId

    if (blogId < 0 || exportId <= 0) return

    const targetDir = path.join(WorkspaceCfg.getWorkspaceUri().fsPath, '博客备份')
    await promisify(fs.mkdir)(targetDir, { recursive: true })
    const nonZipFilePath = path.join(targetDir, treeItem.record.fileName)
    const zipFilePath = nonZipFilePath + '.zip'
    const downloadStream = BlogExportApi.download(blogId, exportId)
    const isFileExist = await fsUtil.exists(zipFilePath)

    await extTreeViews.blogExport.reveal(treeItem, { expand: true })

    const { optionalInstance: blogExportProvider } = BlogExportProvider
    await setCtx('backup.isDownloading', true)

    const onError = async (msg: string) => {
        void Alert.warn(msg)
        if (!isFileExist) fs.rmSync(zipFilePath)
        blogExportProvider?.refreshItem(treeItem)
        await setCtx('backup.isDownloading', false)
    }

    downloadStream
        .on('downloadProgress', ({ transferred, total, percent }: Progress) => {
            const percentage = Math.round(percent * 100)
            treeItem.reportDownloadingProgress({ percentage, transferred, total: total ?? transferred })
            blogExportProvider?.refreshItem(treeItem)
        })
        .on('error', e => {
            treeItem.reportDownloadingProgress(null)
            void onError('下载博客备份失败' + ', ' + e.toString())
        })
        .on('response', () => {
            const statusCode = downloadStream.response?.statusCode

            if (!(statusCode !== undefined && statusCode >= 200 && statusCode < 300))
                void setCtx('backup.isDownloading', false)

            treeItem.reportDownloadingProgress({ percentage: 0 })

            blogExportProvider?.refreshItem(treeItem)
            downloadStream.pipe(
                fs
                    .createWriteStream(zipFilePath)
                    .on('error', e => {
                        void onError(`写入文件 ${zipFilePath} 失败: ${e.message}`)
                    })
                    .on('finish', () => {
                        treeItem.reportDownloadingProgress({ percentage: 100, message: '解压中' })
                        blogExportProvider?.refreshItem(treeItem)

                        void (async () => {
                            try {
                                const entry = new AdmZip(zipFilePath)
                                await promisify(entry.extractAllToAsync.bind(entry))(targetDir, true, undefined)
                                await promisify(fs.rm)(zipFilePath)
                                await DownloadedExportStore.add(nonZipFilePath, exportId)
                                treeItem.reportDownloadingProgress(null)
                                blogExportProvider?.refreshItem(treeItem)
                                await blogExportProvider?.refreshDownloadedExports()
                            } finally {
                                void setCtx('backup.isDownloading', false)
                            }
                        })()
                    })
            )
        })
}
