import { execCmd } from '@/infra/cmd'
import { Uri } from 'vscode'

export const openCnbHome = () => execCmd('vscode.open', Uri.parse('https://www.cnblogs.com'))
