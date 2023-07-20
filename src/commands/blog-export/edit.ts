import { TreeViewCmdHandler } from '@/commands/cmd-handler'
import { openPostFile } from '@/commands/posts-list/open-post-file'
import { Alert } from '@/services/alert.service'
import { Settings } from '@/services/settings.service'
import { ExportPostTreeItem } from '@/tree-view-providers/models/blog-export/post'
import fs from 'fs'
import path from 'path'
import sanitizeFileName from 'sanitize-filename'
import { promisify } from 'util'

export class EditExportPostCmdHandler extends TreeViewCmdHandler<ExportPostTreeItem> {
    static readonly commandName = 'vscode-cnb.blog-export.edit'

    constructor(public readonly input: unknown) {
        super()
    }

    parseInput(): ExportPostTreeItem | null | undefined {
        return this.input instanceof ExportPostTreeItem ? this.input : null
    }

    async handle(): Promise<void> {
        const target = this.parseInput()
        if (!target) return void Alert.warn('不支持的参数输入')

        const {
            post: { title, isMarkdown, id: postId },
            parent: {
                downloadedExport: { filePath: backupFilePath },
                downloadedExport,
            },
        } = target

        const fileName = sanitizeFileName(title)
        const extName = isMarkdown ? 'md' : 'html'
        const dirname = Settings.workspaceUri.fsPath
        const backupName = path.parse(backupFilePath).name
        fs.mkdirSync(dirname, { recursive: true })
        const fullPath = path.join(`${dirname}`, `${fileName}.博客备份-${backupName}-${postId}.${extName}`)

        const { ExportPostStore } = await import('@/services/blog-export-post.store')
        const store = new ExportPostStore(downloadedExport)
        await promisify(fs.writeFile)(fullPath, await store.getBody(postId))

        store.dispose()

        return openPostFile(fullPath, {})
    }
}
