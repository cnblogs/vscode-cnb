import { commands } from 'vscode'
import { Settings } from '@/services/settings.service'

export const revealWorkspaceInOs = () => commands.executeCommand('revealFileInOS', Settings.workspaceUri)
