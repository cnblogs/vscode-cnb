import vscode from 'vscode';

export const openMyWebBlogConsole = () => {
    return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://i.cnblogs.com'));
};
