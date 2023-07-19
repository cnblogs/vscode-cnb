import { AccountInfo } from './account-info'
import { globalCtx } from '@/services/global-state'
import vscode, { authentication, AuthenticationGetSessionOptions, Disposable } from 'vscode'
import { accountViewDataProvider } from '@/tree-view-providers/account-view-data-provider'
import { postsDataProvider } from '@/tree-view-providers/posts-data-provider'
import { postCategoriesDataProvider } from '@/tree-view-providers/post-categories-tree-data-provider'
import { OauthApi } from '@/services/oauth.api'
import { AuthProvider } from '@/auth/auth-provider'
import { AuthSession } from '@/auth/session'
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider'
import { AlertService } from '@/services/alert.service'

const isAuthorizedStorageKey = 'isAuthorized'

export const ACQUIRE_TOKEN_REJECT_UNAUTHENTICATED = 'unauthenticated'
export const ACQUIRE_TOKEN_REJECT_EXPIRED = 'expired'

class AccountManager extends vscode.Disposable {
    private readonly _authProvider = AuthProvider.instance
    private readonly _disposable = Disposable.from(
        this._authProvider.onDidChangeSessions(async ({ added }) => {
            this._session = null
            if (added != null && added.length > 0) await this.ensureSession()

            await this.updateAuthorizationStatus()

            accountViewDataProvider.fireTreeDataChangedEvent()
            postsDataProvider.fireTreeDataChangedEvent(undefined)
            postCategoriesDataProvider.fireTreeDataChangedEvent()

            BlogExportProvider.optionalInstance?.refreshRecords({ force: false, clearCache: true }).catch(console.warn)
        })
    )

    private _oauthClient: OauthApi | null = null
    private _session: AuthSession | null = null

    constructor() {
        super(() => {
            this._disposable.dispose()
        })
    }

    get isAuthorized() {
        return this._session !== null
    }

    get curUser(): AccountInfo {
        return this._session?.account ?? AccountInfo.newAnonymous()
    }

    protected get oauthClient() {
        this._oauthClient ??= new OauthApi()
        return this._oauthClient
    }

    /**
     * Acquire the access token.
     * This will reject with a human-readable reason string if not sign-in or the token has expired.
     * @returns The access token of the active session
     */
    async acquireToken(): Promise<string> {
        const session = await this.ensureSession({ createIfNone: false })

        if (session == null) return Promise.reject(ACQUIRE_TOKEN_REJECT_UNAUTHENTICATED)

        if (session.isExpired) return Promise.reject(ACQUIRE_TOKEN_REJECT_EXPIRED)

        return session.accessToken
    }

    async login() {
        await this.ensureSession({ createIfNone: false, forceNewSession: true })
    }

    async logout() {
        if (!this.isAuthorized) return

        const session = await authentication.getSession(AuthProvider.providerId, [])
        if (session !== undefined) await this._authProvider.removeSession(session.id)

        // For old version compatibility, **never** remove this line
        await globalCtx.storage.update('user', undefined)

        if (session) {
            return this.oauthClient
                .revoke(session.accessToken)
                .catch(console.warn)
                .then(ok => (!ok ? console.warn('Revocation failed') : undefined))
        }
    }

    setup = async () => {
        await this.updateAuthorizationStatus()
    }

    private async updateAuthorizationStatus() {
        await this.ensureSession({ createIfNone: false })

        await vscode.commands.executeCommand(
            'setContext',
            `${globalCtx.extensionName}.${isAuthorizedStorageKey}`,
            this.isAuthorized
        )

        if (this.isAuthorized) {
            await vscode.commands.executeCommand('setContext', `${globalCtx.extensionName}.user`, {
                name: this.curUser.name,
                avatar: this.curUser.avatar,
            })
        }
    }

    private async ensureSession(opt?: AuthenticationGetSessionOptions): Promise<AuthSession | null> {
        const session = await authentication.getSession(this._authProvider.providerId, [], opt).then(
            session => (session ? AuthSession.from(session) : null),
            e => {
                AlertService.err(`创建/获取 session 失败: ${e}`)
            }
        )

        if (session != null && session.account.accountId < 0) {
            this._session = null
            await this._authProvider.removeSession(session.id)
        } else {
            this._session = session
        }

        return this._session
    }
}

export const accountManager = new AccountManager()
