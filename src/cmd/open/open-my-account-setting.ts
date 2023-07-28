import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'

export const openMyAccountSetting = () =>
    execCmd('vscode.open', Uri.parse('https://account.cnblogs.com/settings/account'))
