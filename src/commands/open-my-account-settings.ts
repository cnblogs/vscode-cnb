import vscode from 'vscode'
import { execCmd } from '@/utils/cmd'

export const openMyAccountSettings = () =>
    execCmd('vscode.open', vscode.Uri.parse('https://account.cnblogs.com/settings/account'))
