import vscode from 'vscode';

export const openMyAccountSettings = () => {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://account.cnblogs.com/settings/account'));
};
