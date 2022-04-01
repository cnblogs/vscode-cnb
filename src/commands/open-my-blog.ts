import { accountService } from '../services/account.service';
import vscode from 'vscode';

export const openMyBlog = () => {
    const userBlogUrl = accountService.curUser?.website;
    if (userBlogUrl) {
        return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(userBlogUrl));
    }
};
