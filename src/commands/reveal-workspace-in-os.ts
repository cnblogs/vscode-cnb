import { commands } from 'vscode'
import { execCmd } from '@/utils/cmd'
import { Settings } from '@/services/settings'

export const revealWorkspaceInOs = () => execCmd('revealFileInOS', Settings.workspaceUri)
