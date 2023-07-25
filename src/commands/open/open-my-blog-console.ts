import { Uri } from 'vscode'
import { execCmd } from '@/utils/cmd'

export const openMyWebBlogConsole = () => execCmd('vscode.open', Uri.parse('https://i.cnblogs.com'))
