import { commands } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Settings } from '@/service/settings'

export const revealWorkspaceInOs = () => execCmd('revealFileInOS', Settings.workspaceUri)
