import { accountManager } from '../authentication/account-manager';
import vscode from 'vscode';

export const openMyHomePage = () => {
    const { accountId } = accountManager.curUser;
    if (!accountId || accountId <= 0) return;

    const userHomePageUrl = `https://home.cnblogs.com/u/${accountId}`;
    if (userHomePageUrl) void vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(userHomePageUrl));
};
