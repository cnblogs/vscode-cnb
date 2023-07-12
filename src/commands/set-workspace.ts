import { window } from 'vscode'
import { AlertService } from '@/services/alert.service'
import { Settings } from '@/services/settings.service'

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
    AlertService.info(`工作空间成功修改为: "${Settings.workspaceUri.fsPath}"`)
}
