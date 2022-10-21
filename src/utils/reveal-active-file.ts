import { commands } from 'vscode';

export const revealActiveFileInExplorer = async (): Promise<void> =>
    await commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
