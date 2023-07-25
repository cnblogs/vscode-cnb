import { Uri } from 'vscode'
import { execCmd } from '@/utils/cmd'

export const openCnbIng = () => execCmd('vscode.open', Uri.parse('https://ing.cnblogs.com'))
