import { execCmd } from '@/infra/cmd'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export const revealWorkspaceInOs = () => execCmd('revealFileInOS', WorkspaceCfg.getWorkspaceUri())
