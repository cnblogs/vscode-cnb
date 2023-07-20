import { execCmd } from '@/utils/cmd'
import vscode from 'vscode'

export const openMyWebBlogConsole = () => execCmd('vscode.open', vscode.Uri.parse('https://i.cnblogs.com'))
