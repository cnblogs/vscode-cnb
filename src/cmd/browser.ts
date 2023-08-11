import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { AccountManager } from '@/auth/account-manager'

export namespace Browser.Open {
    export function open(url: string) {
        return execCmd('vscode.open', Uri.parse(url))
    }
}

export namespace Browser.Open.Cnb {
    export const home = () => open('https://www.cnblogs.com')
    export const news = () => open('https://news.cnblogs.com')
    export const ing = () => open('https://ing.cnblogs.com')
    export const q = () => open('https://q.cnblogs.com')
}

export namespace Browser.Open.User {
    export const accountSetting = () => open('https://account.cnblogs.com/settings/account')

    export const blog = () => {
        const blogApp = AccountManager.getUserInfo()?.BlogApp
        if (blogApp !== undefined) void open(`https://www.cnblogs.com/${blogApp}`)
    }

    export const blogConsole = () => open('https://i.cnblogs.com')

    export const home = () => {
        const accountId = AccountManager.getUserInfo()?.SpaceUserID
        if (accountId === undefined || accountId <= 0) return

        const url = `https://home.cnblogs.com/u/${accountId}`
        return open(url)
    }
}
