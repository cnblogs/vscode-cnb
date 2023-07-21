import { window } from 'vscode'
import { Alert } from '@/services/alert.service'
import { Settings } from '@/services/settings.service'

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
