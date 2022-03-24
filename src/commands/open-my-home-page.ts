import { accountService } from '../services/account.service';
import vscode from 'vscode';

export const openMyHomePage = () => {
    const { accountId } = accountService.curUser;
    if (!accountId || accountId <= 0) {
        return;
    }
    const userHomePageUrl = `https://home.cnblogs.com/u/${accountId}`;
    if (userHomePageUrl) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(userHomePageUrl));
    }
};
