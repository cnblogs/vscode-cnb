import { MessageOptions } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Alert } from '@/infra/alert'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export const openWorkspace = async () => {
    const uri = WorkspaceCfg.getWorkspaceUri()
    const options = ['在当前窗口中打开', '在新窗口中打开']
    const msg = `即将打开 ${uri.fsPath}`
    const input = await Alert.info(msg, { modal: true } as MessageOptions, ...options)
    if (input === undefined) return

    const shouldOpenInNewWindow = input === options[1]

    await execCmd('vscode.openFolder', uri, shouldOpenInNewWindow)
}
