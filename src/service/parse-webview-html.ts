import vscode from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'

export type WebviewEntryName = 'ing' | 'post-cfg'

export async function parseWebviewHtml(entry: WebviewEntryName, webview: vscode.Webview) {
    const path = vscode.Uri.joinPath(globalCtx.assetsUri, 'ui', entry, 'index.html')
    const channel = vscode.window.createOutputChannel('vscode-cnb')
    channel.appendLine('path: ' + path.fsPath)
    const file = await vscode.workspace.fs.readFile(path)
    channel.appendLine('vscode.workspace.fs.readFile')
    return file.toString().replace(/@PWD/g, webview.asWebviewUri(globalCtx.assetsUri).toString())
}
