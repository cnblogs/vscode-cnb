import { CnblogsAccountInformation } from './account-information'
import { globalContext } from '../services/global-state'
import vscode, { authentication, AuthenticationGetSessionOptions, Disposable } from 'vscode'
import { accountViewDataProvider } from '../tree-view-providers/account-view-data-provider'
import { postsDataProvider } from '../tree-view-providers/posts-data-provider'
import { postCategoriesDataProvider } from '../tree-view-providers/post-categories-tree-data-provider'
import { OauthApi } from '@/services/oauth.api'
import { CnblogsAuthenticationProvider } from '@/authentication/authentication-provider'
import { CnblogsAuthenticationSession } from '@/authentication/session'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { AlertService } from '@/services/alert.service'

const isAuthorizedStorageKey = 'isAuthorized'

class AccountManager extends vscode.Disposable {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static readonly ACQUIRE_TOKEN_REJECT_UNAUTHENTICATED = 'unauthenticated'
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static readonly ACQUIRE_TOKEN_REJECT_EXPIRED = 'expired'

    private readonly _authenticationProvider: CnblogsAuthenticationProvider
    private readonly _disposable: vscode.Disposable

    private _oauthClient?: OauthApi | null
    private _session?: CnblogsAuthenticationSession | null

    constructor() {
        super(() => {
            this._disposable.dispose()
        })

        this._disposable = Disposable.from(
            (this._authenticationProvider = CnblogsAuthenticationProvider.instance),
            this._authenticationProvider.onDidChangeSessions(async ({ added }) => {
                this._session = null
                if (added != null && added.length > 0) await this.ensureSession()

                await this.updateAuthorizationStatus()

                accountViewDataProvider.fireTreeDataChangedEvent()
                postsDataProvider.fireTreeDataChangedEvent(undefined)
                postCategoriesDataProvider.fireTreeDataChangedEvent()
                BlogExportProvider.optionalInstance
                    ?.refreshRecords({ force: false, clearCache: true })
                    .catch(console.warn)
            })
        )
    }

    get isAuthorized() {
        return this._session != null
    }

    get curUser(): CnblogsAccountInformation {
        return this._session?.account ?? CnblogsAccountInformation.parse()
    }

    protected get oauthClient() {
        return (this._oauthClient ??= new OauthApi())
    }

    /**
     * Acquire the access token.
     * This will reject with a human-readable reason string if not sign-in or the token has expired.
     * @returns The access token of the active session
     */
    async acquireToken(): Promise<string> {
        const session = await this.ensureSession({ createIfNone: false })
        return session == null
            ? Promise.reject(AccountManager.ACQUIRE_TOKEN_REJECT_UNAUTHENTICATED)
            : session.hasExpired
            ? Promise.reject(AccountManager.ACQUIRE_TOKEN_REJECT_EXPIRED)
            : session.accessToken
    }

    async login() {
        await this.ensureSession({ createIfNone: false, forceNewSession: true })
    }

    async logout() {
        if (!this.isAuthorized) return

        const session = await authentication.getSession(CnblogsAuthenticationProvider.providerId, [])
        if (session) await this._authenticationProvider.removeSession(session.id)

        // For old version compatibility, **never** remove this line
        await globalContext.storage.update('user', undefined)

        if (session) {
            return this.oauthClient
                .revoke(session.accessToken)
                .catch(console.warn)
                .then(ok => (!ok ? console.warn('Revocation failed') : undefined))
        }
    }

    setup() {
        this.updateAuthorizationStatus().catch(console.warn)
    }

    private async updateAuthorizationStatus() {
        await this.ensureSession({ createIfNone: false })
        await vscode.commands.executeCommand(
            'setContext',
            `${globalContext.extensionName}.${isAuthorizedStorageKey}`,
            this.isAuthorized
        )
        if (this.isAuthorized) {
            await vscode.commands.executeCommand('setContext', `${globalContext.extensionName}.user`, {
                name: this.curUser.name,
                avatar: this.curUser.avatar,
            })
        }
    }

    private async ensureSession(
        opt?: AuthenticationGetSessionOptions
    ): Promise<CnblogsAuthenticationSession | undefined | null> {
        const session = await authentication.getSession(this._authenticationProvider.providerId, [], opt).then(
            session => (session ? CnblogsAuthenticationSession.parse(session) : null),
            reason => AlertService.warning(`创建/获取 session 失败, ${reason}`)
        )

        if (session != null && session.account.accountId < 0) {
            this._session = null
            await this._authenticationProvider.removeSession(session.id)
        } else {
            this._session = session
        }

        return this._session ?? CnblogsAuthenticationSession.parse()
    }
}

export const accountManager = new AccountManager()
export default accountManager
