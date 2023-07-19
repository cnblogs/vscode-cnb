import { accountManager } from '@/auth/account-manager'
import vscode from 'vscode'

export const openMyBlog = () => {
    const userBlogUrl = accountManager.currentUser?.website
    if (userBlogUrl) return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(userBlogUrl))
}
