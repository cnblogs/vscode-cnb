import { openPostFile } from '@/cmd/post-list/open-post-file'
import { Alert } from '@/infra/alert'
import { ExtCfg } from '@/ctx/ext-cfg'
import { ExportPostTreeItem } from '@/tree-view/model/blog-export/post'
import fs from 'fs'
import path from 'path'
import sanitizeFileName from 'sanitize-filename'
import { promisify } from 'util'

function parseInput(input: unknown): ExportPostTreeItem | null | undefined {
    return input instanceof ExportPostTreeItem ? input : null
}

export async function editExportPost(input: unknown): Promise<void> {
    const target = parseInput(input)
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
    const dirname = ExtCfg.workspaceUri.fsPath
    const backupName = path.parse(backupFilePath).name
    fs.mkdirSync(dirname, { recursive: true })
    const fullPath = path.join(`${dirname}`, `${fileName}.博客备份-${backupName}-${postId}.${extName}`)

    const { ExportPostStore } = await import('@/service/blog-export-post.store')
    const store = new ExportPostStore(downloadedExport)
    await promisify(fs.writeFile)(fullPath, await store.getBody(postId))

    store.dispose()

    return openPostFile(fullPath, {})
}
