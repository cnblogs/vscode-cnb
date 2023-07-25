import { execCmd } from '@/infra/cmd'
import { ExtCfg } from '@/ctx/ext-cfg'

export const revealWorkspaceInOs = () => execCmd('revealFileInOS', ExtCfg.workspaceUri)
