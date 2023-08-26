import { execCmd } from '@/infra/cmd'
import { Alert } from '@/infra/alert'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { TextDocument, WorkspaceEdit, window, Range } from 'vscode'

export namespace Workspace {
    export function resetTextDoc(doc: TextDocument, text: string) {
        const firstLine = doc.lineAt(0)
        const lastLine = doc.lineAt(doc.lineCount - 1)
        const range = new Range(firstLine.range.start, lastLine.range.end)
        const we = new WorkspaceEdit()
        we.replace(doc.uri, range, text, {
            label: '',
            needsConfirmation: false,
        })
        return we
    }

    export async function codeOpen() {
        const uri = WorkspaceCfg.getWorkspaceUri()
        const options = ['在当前窗口中打开', '在新窗口中打开']
        const msg = `即将打开 ${uri.fsPath}`
        const input = await Alert.info(msg, { modal: true }, ...options)
        if (input === undefined) return

        const shouldOpenInNewWindow = input === options[1]

        await execCmd('vscode.openFolder', uri, shouldOpenInNewWindow)
    }

    export function osOpen() {
        void execCmd('revealFileInOS', WorkspaceCfg.getWorkspaceUri())
    }

    export async function set() {
        const uris = await window.showOpenDialog({
            title: '选择工作空间',
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            defaultUri: WorkspaceCfg.getWorkspaceUri(),
        })

        if (uris === undefined) return

        const firstUri = uris[0]

        if (firstUri === undefined) return

        await WorkspaceCfg.setWorkspaceUri(firstUri)
        void Alert.info(`工作空间成功修改为: "${WorkspaceCfg.getWorkspaceUri().fsPath}"`)
    }
}
