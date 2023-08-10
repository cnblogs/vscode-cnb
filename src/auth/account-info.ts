import { UserInfo } from '@/auth/oauth'
import { trim } from 'lodash-es'
import { AuthenticationSessionAccountInformation as ASAI } from 'vscode'
import { AuthProvider } from './auth-provider'

export class AccountInfo implements ASAI {
    readonly id: string
    readonly label: string

    readonly blogApp: string

    constructor(
        public readonly name: string,
        public readonly avatar: string,
        public readonly website: string, // User blog home page url
        public readonly blogId: number,
        public readonly sub: string, // User id (GUID)
        public readonly accountId: number // Space user id
    ) {
        this.id = `${this.accountId}-${AuthProvider.providerId}`
        this.label = name
        this.blogApp = trim(this.website, '/').split('/').pop() ?? ''
    }

    get userId() {
        return this.sub
    }
}

export namespace AccountInfo {
    export function anonymous() {
        return new AccountInfo('anonymous', '', '', -1, '', -1)
    }

    export function fromUserInfo(userInfo: UserInfo) {
        return new AccountInfo(
            userInfo.name,
            userInfo.picture,
            userInfo.website,
            parseInt(userInfo.blog_id, 10),
            userInfo.sub,
            parseInt(userInfo.account_id, 10)
        )
    }
}
