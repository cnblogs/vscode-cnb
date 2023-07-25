import { execCmd } from '@/infra/cmd'
import { Uri } from 'vscode'

export const openCnbQ = () => execCmd('vscode.open', Uri.parse('https://q.cnblogs.com'))
