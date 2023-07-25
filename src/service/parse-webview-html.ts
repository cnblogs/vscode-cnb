import vscode from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'

export type WebviewEntryName = 'ing' | 'post-cfg'

export async function parseWebviewHtml(entry: WebviewEntryName, webview: vscode.Webview) {
    const path = vscode.Uri.joinPath(globalCtx.assetsUri, 'ui', entry, 'index.html')
    const file = await vscode.workspace.fs.readFile(path)
    return file.toString().replace(/@PWD/g, webview.asWebviewUri(globalCtx.assetsUri).toString())
}
