import { AccountInfo } from './account-info'
import { globalCtx } from '@/ctx/global-ctx'
import vscode, { authentication, AuthenticationGetSessionOptions, Disposable } from 'vscode'
import { accountViewDataProvider } from '@/tree-view/provider/account-view-data-provider'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { Oauth } from '@/service/oauth.api'
import { authProvider } from '@/auth/auth-provider'
import { AuthSession } from '@/auth/auth-session'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { Alert } from '@/infra/alert'
import { execCmd } from '@/infra/cmd'

const isAuthorizedStorageKey = 'isAuthorized'

export const ACQUIRE_TOKEN_REJECT_UNAUTHENTICATED = 'unauthenticated'
export const ACQUIRE_TOKEN_REJECT_EXPIRED = 'expired'

class AccountManager extends vscode.Disposable {
    private readonly _disposable = Disposable.from(
        authProvider.onDidChangeSessions(async ({ added }) => {
            this._session = null
            if (added != null && added.length > 0) await this.ensureSession()

            await this.updateAuthStatus()

            accountViewDataProvider.fireTreeDataChangedEvent()
            postDataProvider.fireTreeDataChangedEvent(undefined)
            postCategoryDataProvider.fireTreeDataChangedEvent()

            BlogExportProvider.optionalInstance?.refreshRecords({ force: false, clearCache: true }).catch(console.warn)
        })
    )

    private _session: AuthSession | null = null

    constructor() {
        super(() => {
            this._disposable.dispose()
        })
    }

    get isAuthorized() {
        return this._session !== null
    }

    get currentUser(): AccountInfo {
        return this._session?.account ?? AccountInfo.newAnonymous()
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

        const session = await authentication.getSession(authProvider.providerId, [])

        // WRN: For old version compatibility, **never** remove this line
        await globalCtx.storage.update('user', undefined)

        if (session === undefined) return

        try {
            await authProvider.removeSession(session.id)
            await Oauth.revokeToken(session.accessToken)
        } catch (e: any) {
            void Alert.err(`登出发生错误: ${e}`)
        }
    }

    async updateAuthStatus() {
        await this.ensureSession({ createIfNone: false })

        await execCmd('setContext', `${globalCtx.extName}.${isAuthorizedStorageKey}`, this.isAuthorized)

        if (this.isAuthorized) {
            await execCmd('setContext', `${globalCtx.extName}.user`, {
                name: this.currentUser.name,
                avatar: this.currentUser.avatar,
            })
        }
    }

    private async ensureSession(opt?: AuthenticationGetSessionOptions): Promise<AuthSession | null> {
        const session = await authentication.getSession(authProvider.providerId, [], opt).then(
            session => (session ? AuthSession.from(session) : null),
            e => {
                void Alert.err(`创建/获取 Session 失败: ${e}`)
            }
        )

        if (session != null && session.account.accountId < 0) {
            this._session = null
            await authProvider.removeSession(session.id)
        } else {
            this._session = session
        }

        return this._session
    }
}

export const accountManager = new AccountManager()
