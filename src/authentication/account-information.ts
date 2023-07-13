import { UserInformationSpec } from '@/services/oauth.api'
import { trim } from 'lodash-es'
import { AuthenticationSessionAccountInformation } from 'vscode'
import { CnblogsAuthenticationProvider } from './authentication-provider'

export class CnblogsAccountInformation implements AuthenticationSessionAccountInformation {
    readonly label: string
    readonly id: string

    private _blogApp?: string | null

    /**
     * Creates an instance of {@link CnblogsAccountInformation}.
     * @param {string} [name='unknown']
     * @param {string} [avatar='']
     * @param {string} [website=''] The user blog home page url
     * @param {number} [blogId=-1]
     * @param {string} [sub=''] UserId(data type is Guid)
     * @param {number} [accountId=-1] SpaceUserId
     */
    private constructor(
        public readonly name: string,
        public readonly avatar: string,
        public readonly website: string,
        public readonly blogId: number,
        public readonly sub: string,
        public readonly accountId: number
    ) {
        this.id = `${this.accountId}-${CnblogsAuthenticationProvider.providerId}`
        this.label = name
    }

    get userId() {
        return this.sub
    }

    get blogApp(): string | null {
        if (this._blogApp == null) this._blogApp = this.parseBlogApp()

        return this._blogApp
    }

    static parse(userInfo: Partial<UserInformationSpec & CnblogsAccountInformation> = {}) {
        return new CnblogsAccountInformation(
            userInfo.name || 'anonymous',
            userInfo.picture || userInfo.avatar || '',
            userInfo.website || '',
            userInfo.blog_id ? parseInt(userInfo.blog_id, 10) : userInfo.blogId ?? -1,
            userInfo.sub || '',
            userInfo.account_id ? parseInt(userInfo.account_id, 10) : userInfo.accountId ?? -1
        )
    }

    private parseBlogApp() {
        return (
            trim(this.website ?? '', '/')
                .split('/')
                .pop() ?? null
        )
    }
}
