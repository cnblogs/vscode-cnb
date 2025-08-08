import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { UserService } from '@/service/user.service'
import { Alert } from '@/infra/alert'

export class Browser {
    static Open = class {
        static open(url: string) {
            return execCmd('vscode.open', Uri.parse(url))
        }

        static Cnb = class {
            static home = () => Browser.Open.open('https://www.cnblogs.com')
            static news = () => Browser.Open.open('https://news.cnblogs.com')
            static ing = () => Browser.Open.open('https://ing.cnblogs.com')
            static q = () => Browser.Open.open('https://q.cnblogs.com')
        }

        User = class {
            static accountSetting = () => Browser.Open.open('https://account.cnblogs.com/settings/account')
            static buyVip = () => Browser.Open.open('https://cnblogs.vip/')

            static async blog() {
                const blogApp = (await UserService.getUserInfo())?.blogApp

                if (blogApp == null) return void Alert.warn('未开通博客')

                void Browser.Open.open(`https://www.cnblogs.com/${blogApp}`)
            }

            static blogConsole = () => Browser.Open.open('https://write.cnblogs.com')

            static async home() {
                const accountId = (await UserService.getUserInfo())?.accountId
                if (accountId !== undefined) {
                    const url = `https://home.cnblogs.com/u/${accountId}`
                    return Browser.Open.open(url)
                }
            }
        }
    }
}
