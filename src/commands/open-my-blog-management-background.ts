import * as vscode from 'vscode';

export const openMyBlogManagementBackground = () => {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://i.cnblogs.com'));
};
