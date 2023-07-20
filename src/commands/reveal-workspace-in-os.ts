import { Settings } from '@/services/settings.service'
import { execCmd } from '@/utils/cmd'
import { commands } from 'vscode'

export const revealWorkspaceInOs = () => execCmd('revealFileInOS', Settings.workspaceUri)
