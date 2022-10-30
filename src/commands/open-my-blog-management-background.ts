import vscode from 'vscode';

export const openMyWebBlogConsole = () =>
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://i.cnblogs.com'));
