import { openPostFile } from '@/cmd/post-list/open-post-file'
import { Alert } from '@/infra/alert'
import { ExportPostTreeItem } from '@/tree-view/model/blog-export/post'
import fs from 'fs'
import path from 'path'
import sanitizeFileName from 'sanitize-filename'
import { promisify } from 'util'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export async function editExportPost(treeItem?: ExportPostTreeItem) {
    if (!(treeItem instanceof ExportPostTreeItem)) return void Alert.warn('不支持的参数输入')

    const {
        post: { title, isMarkdown, id: postId },
        parent: {
            downloadedExport: { filePath: backupFilePath },
            downloadedExport,
        },
    } = treeItem

    const fileName = sanitizeFileName(title)
    const extName = isMarkdown ? 'md' : 'html'
    const dirname = WorkspaceCfg.getWorkspaceUri().fsPath
    const backupName = path.parse(backupFilePath).name
    fs.mkdirSync(dirname, { recursive: true })
    const fullPath = path.join(`${dirname}`, `${fileName}.博客备份-${backupName}-${postId}.${extName}`)

    const { ExportPostStore } = await import('@/service/blog-export/blog-export-post.store')
    const store = new ExportPostStore(downloadedExport)
    await promisify(fs.writeFile)(fullPath, await store.getBody(postId))

    store.dispose()

    return openPostFile(fullPath, {})
}
