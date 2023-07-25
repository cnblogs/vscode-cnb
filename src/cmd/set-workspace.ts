import { window } from 'vscode'
import { Alert } from '@/infra/alert'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export const setWorkspace = async () => {
    const uris =
        (await window.showOpenDialog({
            title: '选择工作空间',
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            defaultUri: WorkspaceCfg.getWorkspaceUri(),
        })) ?? []

    const firstUri = uris[0]

    if (firstUri === undefined) return

    await WorkspaceCfg.setWorkspaceUri(firstUri)
    void Alert.info(`工作空间成功修改为: "${WorkspaceCfg.getWorkspaceUri().fsPath}"`)
}
