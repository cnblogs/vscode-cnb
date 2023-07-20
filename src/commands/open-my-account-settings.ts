import { execCmd } from '@/utils/cmd'
import vscode from 'vscode'

export const openMyAccountSettings = () =>
    execCmd('vscode.open', vscode.Uri.parse('https://account.cnblogs.com/settings/account'))
