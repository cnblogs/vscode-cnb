import { accountService } from '../services/account.service';
import * as vscode from 'vscode';

export const openMyHomePage = () => {
    const userName = accountService.curUser?.name;
    if (!userName) {
        return;
    }
    const userHomePageUrl = `https://home.cnblogs.com/u/${userName}`;
    if (userHomePageUrl) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(userHomePageUrl));
    }
};
