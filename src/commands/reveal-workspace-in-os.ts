import { commands } from 'vscode';
import { Settings } from '../services/settings.service';

export const revealWorkspaceInOs = () => {
    return commands.executeCommand('revealFileInOS', Settings.workspaceUri);
};
