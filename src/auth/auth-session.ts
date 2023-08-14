import { AccountInfo } from '@/auth/account-info'
import { AuthenticationSession as CodeAuthSession } from 'vscode'

export class AuthSession implements CodeAuthSession {
    constructor(
        public readonly account: AccountInfo,
        public readonly id: string,
        public readonly accessToken: string,
        public readonly scopes: string[]
    ) {}

    get isExpired() {
        // TODO: need better solution
        if (this.accessToken.length === 64) return false

        const accessTokenPart2 = this.accessToken.split('.')[1]
        const buf = Buffer.from(accessTokenPart2, 'base64')
        return (<{ exp: number }>JSON.parse(buf.toString())).exp
    }
}
