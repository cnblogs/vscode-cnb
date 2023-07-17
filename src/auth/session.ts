import { AccessToken } from '@/auth/access-token'
import { CnblogsAccountInformation } from '@/auth/account-information'
import { keys, merge, pick } from 'lodash-es'
import { AuthenticationSession } from 'vscode'

export class CnblogsAuthenticationSession implements AuthenticationSession {
    private _parsedAccessToken?: AccessToken | null

    private constructor(
        public readonly account: CnblogsAccountInformation,
        public readonly id = '',
        public readonly accessToken = '',
        public readonly refreshToken = '',
        public readonly scopes: readonly string[] = []
    ) {}

    get hasExpired() {
        const { exp } = this.parsedAccessToken
        return typeof exp === 'number' ? exp * 1000 <= Date.now() : true
    }

    private get parsedAccessToken() {
        return (this._parsedAccessToken ??= JSON.parse(
            Buffer.from(this.accessToken.split('.')[1], 'base64').toString()
        )) as AccessToken
    }

    static parse<T extends AuthenticationSession | Partial<CnblogsAuthenticationSession>>(data?: T) {
        const obj = new CnblogsAuthenticationSession(CnblogsAccountInformation.parse({}))
        merge(obj, pick(data, keys(obj)))

        return obj.account instanceof CnblogsAccountInformation
            ? obj
            : merge(obj, { account: CnblogsAccountInformation.parse(obj.account) })
    }
}
