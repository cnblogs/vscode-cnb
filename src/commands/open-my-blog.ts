import { accountManager } from '@/auth/account-manager'
import vscode from 'vscode'
import { execCmd } from '@/utils/cmd'

export const openMyBlog = () => {
    const userBlogUrl = accountManager.currentUser?.website
    if (userBlogUrl) return execCmd('vscode.open', vscode.Uri.parse(userBlogUrl))
}
