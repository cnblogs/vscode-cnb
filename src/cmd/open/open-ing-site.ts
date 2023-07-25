import { execCmd } from '@/infra/cmd'
import { globalCtx } from '@/service/global-ctx'
import { Uri } from 'vscode'

export const openIngSite = () => execCmd('vscode.open', Uri.parse(globalCtx.config.ingSite))
