import { Uri, window, workspace } from 'vscode'
import { dirname } from 'path'
import { extractImg } from '@/service/extract-img/extract-img'
import { Workspace } from '@/cmd/workspace'

export async function extractImgCmd(uri?: Uri) {
    if (uri === undefined) return
    if (uri.scheme !== 'file') return

    const editor = window.visibleTextEditors.find(x => x.document.fileName === uri.fsPath)
    const textDocument = editor?.document ?? workspace.textDocuments.find(x => x.fileName === uri.fsPath)
    if (textDocument === undefined) return

    const fileDir = dirname(textDocument.uri.fsPath)
    const extracted = await extractImg(textDocument.getText(), fileDir)
    if (extracted === undefined) return

    const we = Workspace.resetTextDoc(textDocument, extracted)

    await workspace.applyEdit(we)
}
