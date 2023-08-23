import { DownloadedBlogExport } from '@/model/blog-export'
import { ExportPost } from '@/model/blog-export/export-post'
import { ExportPostTreeItem } from '@/tree-view/model/blog-export/post'
import { URLSearchParams } from 'url'
import { languages, TextDocumentContentProvider, Uri, window, workspace } from 'vscode'

export async function viewPostBlogExport(treeItem?: ExportPostTreeItem) {
    if (!(treeItem instanceof ExportPostTreeItem)) return
    if (treeItem.parent.downloadedExport == null) return

    await provide(treeItem.parent.downloadedExport, treeItem.post)
}

async function provide(downloadedExport: DownloadedBlogExport, { id: postId, title, isMarkdown }: ExportPost) {
    const schemaWithId = `vscode-cnb.backup.post-${postId}`

    const matchedEditor = window.visibleTextEditors.find(({ document }) => {
        if (document.uri.scheme === schemaWithId && !document.isClosed) {
            const query = new URLSearchParams(document.uri.query)
            const parsedId = Number.parseInt(query.get('postId') ?? '-1')
            if (parsedId > 0 && parsedId === postId) return true
        }

        return false
    })
    if (matchedEditor !== undefined) {
        await window.showTextDocument(matchedEditor.document, { preview: false, preserveFocus: true })
        return
    }

    const disposable = workspace.registerTextDocumentContentProvider(
        schemaWithId,
        new (class implements TextDocumentContentProvider {
            async provideTextDocumentContent(): Promise<string> {
                const { ExportPostStore } = await import('@/service/blog-export/blog-export-post.store')
                const store = new ExportPostStore(downloadedExport)
                return store.getBody(postId).finally(() => store.dispose())
            }
        })()
    )

    const uri = Uri.parse(`${schemaWithId}:(只读) ${title}.${isMarkdown ? 'md' : 'html'}?postId=${postId}`)
    const document = await workspace.openTextDocument(uri)

    await window.showTextDocument(document)
    await languages.setTextDocumentLanguage(document, isMarkdown ? 'markdown' : 'html')

    disposable.dispose()
}
