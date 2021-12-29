import { commands, MessageOptions, window } from 'vscode';
import { Settings } from '../services/settings.service';

export const openWorkspace = async () => {
    const uri = Settings.workspaceUri;
    const { fsPath } = uri;
    const options = ['在当前窗口中打开', '在新窗口中打开'];
    const input = await window.showInformationMessage(
        `即将打开 ${fsPath}`,
        { modal: true } as MessageOptions,
        ...options
    );
    const newWindow = input === options[1];

    await commands.executeCommand('vscode.openFolder', uri, newWindow);
};
