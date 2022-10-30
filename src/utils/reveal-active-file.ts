import { commands } from 'vscode';

export const revealActiveFileInExplorer = () =>
    commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
