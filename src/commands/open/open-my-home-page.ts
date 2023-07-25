import { accountManager } from '@/auth/account-manager'
import { execCmd } from '@/utils/cmd'
import { Uri } from 'vscode'

export const openMyHomePage = () => {
    const { accountId } = accountManager.currentUser
    if (!accountId || accountId <= 0) return

    const userHomePageUrl = `https://home.cnblogs.com/u/${accountId}`
    if (userHomePageUrl) void execCmd('vscode.open', Uri.parse(userHomePageUrl))
}
