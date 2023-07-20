import { accountManager } from '@/auth/account-manager'
import { execCmd } from '@/utils/cmd'
import vscode from 'vscode'

export const openMyBlog = () => {
    const userBlogUrl = accountManager.currentUser?.website
    if (userBlogUrl) return execCmd('vscode.open', vscode.Uri.parse(userBlogUrl))
}
