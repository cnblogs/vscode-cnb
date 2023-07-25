import { Uri } from 'vscode'
import { execCmd } from '@/utils/cmd'

export const openMyAccountSettings = () =>
    execCmd('vscode.open', Uri.parse('https://account.cnblogs.com/settings/account'))
