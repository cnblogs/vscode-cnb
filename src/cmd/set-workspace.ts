import { window } from 'vscode'
import { Alert } from '@/infra/alert'
import { ExtCfg } from '@/ctx/ext-cfg'

export const setWorkspace = async () => {
    const uris =
        (await window.showOpenDialog({
            title: '选择工作空间',
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            defaultUri: ExtCfg.workspaceUri,
        })) ?? []

    const firstUri = uris[0]

    if (firstUri === undefined) return

    await ExtCfg.setWorkspaceUri(firstUri)
    void Alert.info(`工作空间成功修改为: "${ExtCfg.workspaceUri.fsPath}"`)
}
