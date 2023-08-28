import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { UserService } from '@/service/user-info'

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

    export async function blog() {
        const blogApp = (await UserService.getInfo())?.blog_app
        if (blogApp !== undefined) void open(`https://www.cnblogs.com/${blogApp}`)
    }

    export const blogConsole = () => open('https://i.cnblogs.com')

    export async function home() {
        const accountId = (await UserService.getInfo())?.space_user_id
        if (accountId !== undefined) {
            const url = `https://home.cnblogs.com/u/${accountId}`
            return open(url)
        }
    }
}
