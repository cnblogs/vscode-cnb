import { TreeViewCommandHandler } from '@/commands/command-handler'
import { AlertService } from '@/services/alert.service'
import { BlogExportApi } from '@/services/blog-export.api'
import { DownloadedExportStore } from '@/services/downloaded-export.store'
import { globalCtx } from '@/services/global-ctx'
import { Settings } from '@/services/settings.service'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { BlogExportRecordTreeItem } from '@/tree-view-providers/models/blog-export'
import { extensionViews } from '@/tree-view-providers/tree-view-registration'
import fs from 'fs'
import { Progress } from 'got'
import path from 'path'
import { promisify } from 'util'
import { commands } from 'vscode'

export class DownloadExportCommandHandler extends TreeViewCommandHandler<BlogExportRecordTreeItem> {
    static readonly commandName = 'vscode-cnb.blog-export.download'

    constructor(public readonly input: unknown) {
        super()
    }

    parseInput(): BlogExportRecordTreeItem | null | undefined {
        return this.input instanceof BlogExportRecordTreeItem ? this.input : null
    }

    async handle(): Promise<void> {
        const treeItem = this.parseInput()
        if (treeItem == null) return
        const {
            record: { id: exportId, blogId },
        } = treeItem

        if (blogId < 0 || exportId <= 0) return

        const targetDir = path.join(Settings.workspaceUri.fsPath, '博客备份')
        await promisify(fs.mkdir)(targetDir, { recursive: true })
        const nonZipFilePath = path.join(targetDir, treeItem.record.fileName)
        const zipFilePath = nonZipFilePath + '.zip'
        const downloadStream = BlogExportApi.download(blogId, exportId)
        const isFileExist = await promisify(fs.exists)(zipFilePath)

        extensionViews.blogExport.reveal(treeItem, { expand: true }).then(undefined, console.warn)

        const { optionalInstance: blogExportProvider } = BlogExportProvider
        await this.setIsDownloading(true)

        const onError = (msg?: string | null) => {
            if (msg) AlertService.warn(msg)
            if (!isFileExist) fs.rmSync(zipFilePath)
            blogExportProvider?.refreshItem(treeItem)
            this.setIsDownloading(false).then(undefined, console.warn)
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
                                        this.setIsDownloading(false).then(undefined, console.warn)
                                    })
                            })
                    )
                } else {
                    this.setIsDownloading(false).then(undefined, console.warn)
                }
            })
    }

    private setIsDownloading(value: boolean) {
        return commands.executeCommand('setContext', `${globalCtx.extName}.blog-export.downloading`, value || undefined)
    }
}
