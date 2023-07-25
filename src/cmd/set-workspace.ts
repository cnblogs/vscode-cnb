import { window } from 'vscode'
import { Alert } from '@/service/alert'
import { Settings } from '@/service/settings'

export const setWorkspace = async () => {
    const uris =
        (await window.showOpenDialog({
            title: '选择工作空间',
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            defaultUri: Settings.workspaceUri,
        })) ?? []

    const firstUri = uris[0]

    if (firstUri === undefined) return

    await Settings.setWorkspaceUri(firstUri)
    void Alert.info(`工作空间成功修改为: "${Settings.workspaceUri.fsPath}"`)
}
