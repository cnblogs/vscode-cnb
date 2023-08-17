import { Alert } from '@/infra/alert'
import { BlogExportApi } from '@/service/blog-export/blog-export'
import { DownloadedExportStore } from '@/service/downloaded-export.store'
import { globalCtx } from '@/ctx/global-ctx'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { BlogExportRecordTreeItem } from '@/tree-view/model/blog-export'
import { extTreeViews } from '@/tree-view/tree-view-register'
import fs from 'fs'
import { Progress } from 'got'
import path from 'path'
import { promisify } from 'util'
import { execCmd } from '@/infra/cmd'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

function parseInput(input: unknown): BlogExportRecordTreeItem | null | undefined {
    return input instanceof BlogExportRecordTreeItem ? input : null
}

export async function downloadBlogExport(input: unknown) {
    const treeItem = parseInput(input)
    if (treeItem == null) return
    const {
        record: { id: exportId, blogId },
    } = treeItem

    if (blogId < 0 || exportId <= 0) return

    const targetDir = path.join(WorkspaceCfg.getWorkspaceUri().fsPath, '博客备份')
    await promisify(fs.mkdir)(targetDir, { recursive: true })
    const nonZipFilePath = path.join(targetDir, treeItem.record.fileName)
    const zipFilePath = nonZipFilePath + '.zip'
    const downloadStream = BlogExportApi.download(blogId, exportId)
    const isFileExist = await promisify(fs.exists)(zipFilePath)

    extTreeViews.blogExport.reveal(treeItem, { expand: true }).then(undefined, console.warn)

    const { optionalInstance: blogExportProvider } = BlogExportProvider
    await setIsDownloading(true)

    const onError = (msg: string) => {
        void Alert.warn(msg)
        if (!isFileExist) fs.rmSync(zipFilePath)
        blogExportProvider?.refreshItem(treeItem)
        setIsDownloading(false).then(undefined, console.warn)
    }

    downloadStream
        .on('downloadProgress', ({ transferred, total, percent }: Progress) => {
            const percentage = Math.round(percent * 100)
            treeItem.reportDownloadingProgress({ percentage, transferred, total: total ?? transferred })
            blogExportProvider?.refreshItem(treeItem)
        })
        .on('error', e => {
            treeItem.reportDownloadingProgress(null)
            onError('下载博客备份失败' + ', ' + e.toString())
        })
        .on('response', () => {
            const statusCode = downloadStream.response?.statusCode
            if (statusCode != null && statusCode >= 200 && statusCode < 300) {
                treeItem.reportDownloadingProgress({ percentage: 0 })

                blogExportProvider?.refreshItem(treeItem)
                downloadStream.pipe(
                    fs
                        .createWriteStream(zipFilePath)
                        .on('error', error => {
                            onError(`写入文件 ${zipFilePath} 时发生异常, ${error.message}`)
                        })
                        .on('finish', () => {
                            treeItem.reportDownloadingProgress({ percentage: 100, message: '解压中' })
                            blogExportProvider?.refreshItem(treeItem)

                            import('adm-zip')
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                .then(({ default: AdmZip }) => {
                                    const entry = new AdmZip(zipFilePath)
                                    return promisify(entry.extractAllToAsync.bind(entry))(
                                        targetDir,
                                        true,
                                        undefined
                                    ).then(() => promisify(fs.rm)(zipFilePath))
                                })
                                .then(() => {
                                    DownloadedExportStore.add(nonZipFilePath, exportId)
                                        .then(() => treeItem.reportDownloadingProgress(null))
                                        .then(() => blogExportProvider?.refreshItem(treeItem))
                                        .then(() => blogExportProvider?.refreshDownloadedExports())
                                        .catch(console.warn)
                                }, console.warn)
                                .finally(() => {
                                    setIsDownloading(false).then(undefined, console.warn)
                                })
                        })
                )
            } else {
                setIsDownloading(false).then(undefined, console.warn)
            }
        })
}

function setIsDownloading(value: boolean) {
    return execCmd('setContext', `${globalCtx.extName}.backup.downloading`, value || undefined)
}
