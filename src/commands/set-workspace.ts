import { Alert } from '@/services/alert.service'
import { Settings } from '@/services/settings.service'
import { window } from 'vscode'

export const setWorkspace = async () => {
    const input = ((await window.showOpenDialog({
        title: '选择工作空间',
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        defaultUri: Settings.workspaceUri,
    })) ?? [])[0]

    if (!input) return

    await Settings.setWorkspaceUri(input)
    void Alert.info(`工作空间成功修改为: "${Settings.workspaceUri.fsPath}"`)
}
