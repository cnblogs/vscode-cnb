import { UserInfoSpec } from '@/auth/oauth'
import { trim } from 'lodash-es'
import { AuthenticationSessionAccountInformation } from 'vscode'
import { AuthProvider } from './auth-provider'

export class AccountInfo implements AuthenticationSessionAccountInformation {
    readonly label: string
    readonly id: string

    private _blogApp: string | null = null

    private constructor(
        public readonly name: string,
        public readonly avatar: string,
        public readonly website: string, //The user blog home page url
        public readonly blogId: number,
        public readonly sub: string, //UserId(data type is Guid)
        public readonly accountId: number //SpaceUserId
    ) {
        this.id = `${this.accountId}-${AuthProvider.providerId}`
        this.label = name
    }

    get userId() {
        return this.sub
    }

    get blogApp(): string | null {
        this._blogApp ??= this.parseBlogApp()
        return this._blogApp
    }

    static newAnonymous = () => new AccountInfo('anonymous', '', '', -1, '', -1)

    static from = (userInfo: UserInfoSpec) =>
        new AccountInfo(
            userInfo.name,
            userInfo.picture,
            userInfo.website,
            parseInt(userInfo.blog_id, 10),
            userInfo.sub,
            parseInt(userInfo.account_id, 10)
        )

    private parseBlogApp = () =>
        trim(this.website ?? '', '/')
            .split('/')
            .pop() ?? null
}
