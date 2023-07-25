import { execCmd } from '@/utils/cmd'
import { Uri } from 'vscode'

export const openCnbNews = () => execCmd('vscode.open', Uri.parse('https://news.cnblogs.com'))
