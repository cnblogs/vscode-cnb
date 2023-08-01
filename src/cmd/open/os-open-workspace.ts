import { execCmd } from '@/infra/cmd'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export const osOpenWorkspace = () => execCmd('revealFileInOS', WorkspaceCfg.getWorkspaceUri())
