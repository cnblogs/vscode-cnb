import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'

export const openMyWebBlogConsole = () => execCmd('vscode.open', Uri.parse('https://i.cnblogs.com'))
