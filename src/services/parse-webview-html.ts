import vscode from 'vscode'
import { globalCtx } from 'src/services/global-state'

export type WebviewEntryName = 'ing' | 'post-configuration'

export const parseWebviewHtml = async (entry: WebviewEntryName, webview: vscode.Webview) =>
    (await vscode.workspace.fs.readFile(vscode.Uri.joinPath(globalCtx.assetsUri, 'ui', entry, 'index.html')))
        .toString()
        .replace(/@PWD/g, webview.asWebviewUri(globalCtx.assetsUri).toString())
