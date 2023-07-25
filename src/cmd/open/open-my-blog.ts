import { accountManager } from '@/auth/account-manager'
import { execCmd } from '@/infra/cmd'
import { Uri } from 'vscode'

export const openMyBlog = () => {
    const userBlogUrl = accountManager.currentUser?.website
    if (userBlogUrl) return execCmd('vscode.open', Uri.parse(userBlogUrl))
}
