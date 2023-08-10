import { AccessToken } from '@/auth/access-token'
import { AccountInfo } from '@/auth/account-info'
import { keys, merge, pick } from 'lodash-es'
import { AuthenticationSession } from 'vscode'

export class AuthSession implements AuthenticationSession {
    private _parsedAccessToken: AccessToken | null = null

    private constructor(
        public readonly account: AccountInfo,
        public readonly id = '',
        public readonly accessToken = '',
        public readonly scopes: readonly string[] = []
    ) {}

    get isExpired() {
        // TODO: need better solution
        if (this.accessToken.length === 64) return false

        if (this._parsedAccessToken == null) {
            const buf = Buffer.from(this.accessToken.split('.')[1], 'base64')
            this._parsedAccessToken ??= JSON.parse(buf.toString())
        }

        if (this._parsedAccessToken == null) return true
        return this._parsedAccessToken.exp * 1000 <= Date.now()
    }

    static from<T extends AuthenticationSession | Partial<AuthSession>>(t?: T) {
        const session = new AuthSession(AccountInfo.anonymous())

        merge(session, pick(t, keys(session)))

        return session
    }
}
