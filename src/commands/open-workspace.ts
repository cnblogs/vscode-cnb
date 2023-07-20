import { Alert } from '@/services/alert.service'
import { Settings } from '@/services/settings.service'
import { execCmd } from '@/utils/cmd'
import { MessageOptions } from 'vscode'

export const openWorkspace = async () => {
    const uri = Settings.workspaceUri
    const { fsPath } = uri
    const options = ['在当前窗口中打开', '在新窗口中打开']
    const input = await Alert.info(`即将打开 ${fsPath}`, { modal: true } as MessageOptions, ...options)
    if (!input) return

    const shouldOpenInNewWindow = input === options[1]

    await execCmd('vscode.openFolder', uri, shouldOpenInNewWindow)
}
