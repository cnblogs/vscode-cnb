import { AuthSession } from '@/auth/auth-session'
import { genVerifyChallengePair } from '@/service/code-challenge'
import { isArray, isUndefined } from 'lodash-es'
import {
    authentication,
    AuthenticationProvider,
    AuthenticationProviderAuthenticationSessionsChangeEvent as VscAuthProviderAuthSessionChEv,
    CancellationToken,
    CancellationTokenSource,
    Disposable,
    env,
    EventEmitter,
    ProgressLocation,
    Uri,
    window,
} from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'
import RandomString from 'randomstring'
import { Oauth } from '@/service/oauth.api'
import { extUriHandler } from '@/infra/uri-handler'
import { AccountInfo } from '@/auth/account-info'
import { TokenInfo } from '@/model/token-info'
import { Optional } from 'utility-types'
import { consUrlPara } from '@/infra/http/infra/url'

export class AuthProvider implements AuthenticationProvider, Disposable {
    static readonly providerId = 'cnblogs'
    static readonly providerName = '博客园Cnblogs'

    readonly providerId = AuthProvider.providerId
    readonly providerName = AuthProvider.providerName

    protected readonly sessionStorageKey = `${AuthProvider.providerId}.sessions`
    protected readonly allScopes = globalCtx.config.oauth.scope.split(' ')

    private _allSessions?: AuthSession[] | null

    private readonly _sessionChangeEmitter = new EventEmitter<VscAuthProviderAuthSessionChEv>()
    private readonly _disposable = Disposable.from(
        this._sessionChangeEmitter,
        authentication.registerAuthenticationProvider(AuthProvider.providerId, AuthProvider.providerName, this, {
            supportsMultipleAccounts: false,
        }),
        this.onDidChangeSessions(() => {
            this._allSessions = null
        })
    )

    get onDidChangeSessions() {
        return this._sessionChangeEmitter.event
    }

    async getSessions(scopes?: readonly string[]): Promise<readonly AuthSession[]> {
        const sessions = await this.getAllSessions()
        const parsedScopes = this.ensureScopes(scopes)

        return sessions
            .map(x => AuthSession.from(x))
            .filter(({ scopes: sessionScopes }) => parsedScopes.every(x => sessionScopes.includes(x)))
    }

    createSession(scopes: readonly string[]): Thenable<AuthSession> {
        const parsedScopes = this.ensureScopes(scopes)
        const options = {
            title: `${globalCtx.displayName} - 登录`,
            cancellable: true,
            location: ProgressLocation.Notification,
        }

        let disposable: Disposable | null
        const cancelTokenSrc = new CancellationTokenSource()

        let isTimeout = false

        const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId)
            isTimeout = true
            cancelTokenSrc.cancel()
        }, 30 * 60 * 1000) // 30 min

        const verifyCode = this.signInWithBrowser({ scopes: parsedScopes })

        return window.withProgress<AuthSession>(options, async (progress, cancelToken) => {
            progress.report({ message: '等待用户在浏览器中进行授权...' })

            const fut = new Promise<AuthSession>((resolve, reject) => {
                disposable = Disposable.from(
                    cancelToken.onCancellationRequested(() => cancelTokenSrc.cancel()),
                    cancelTokenSrc.token.onCancellationRequested(() => {
                        reject(`${isTimeout ? '由于超时, ' : ''}登录操作已取消`)
                    }),
                    cancelTokenSrc,
                    extUriHandler
                )
                extUriHandler.onUri(async uri => {
                    if (cancelTokenSrc.token.isCancellationRequested) return

                    const authCode = this.parseOauthCallbackUri(uri)
                    if (authCode == null) return

                    progress.report({ message: '已获得授权, 正在获取令牌...' })

                    const token = await Oauth.fetchToken(verifyCode, authCode)

                    const authSession = await this.onAccessTokenGranted(token, {
                        cancelToken: cancelTokenSrc.token,
                        onStateChange(state) {
                            progress.report({ message: state })
                        },
                    })

                    resolve(authSession)
                })
            })

            try {
                return await fut
            } finally {
                disposable?.dispose()
            }
        })
    }

    async removeSession(sessionId: string): Promise<void> {
        const data = (await this.getAllSessions()).reduce(
            ({ removed, keep }, c) => {
                c.id === sessionId ? removed.push(c) : keep.push(c)
                return { removed, keep }
            },
            { removed: <AuthSession[]>[], keep: <AuthSession[]>[] }
        )
        await globalCtx.extCtx.secrets.store(this.sessionStorageKey, JSON.stringify(data.keep))
        this._sessionChangeEmitter.fire({ removed: data.removed, added: undefined, changed: undefined })
    }

    dispose() {
        this._disposable.dispose()
    }

    protected async getAllSessions(): Promise<AuthSession[]> {
        const legacyToken = LegacyTokenStore.getAccessToken()
        if (legacyToken != null) {
            await this.onAccessTokenGranted({ accessToken: legacyToken }, { shouldFireSessionAddedEvent: false })
                .then(undefined, console.warn)
                .finally(() => void LegacyTokenStore.remove())
        }

        if (this._allSessions == null || this._allSessions.length <= 0) {
            const sessions = JSON.parse((await globalCtx.secretsStorage.get(this.sessionStorageKey)) ?? '[]') as
                | AuthSession[]
                | null
                | undefined
                | unknown
            this._allSessions = isArray(sessions) ? sessions.map(x => AuthSession.from(x)) : []
        }

        return this._allSessions
    }

    private signInWithBrowser({ scopes }: { scopes: readonly string[] }) {
        const [verifyCode, challengeCode] = genVerifyChallengePair()
        const { clientId, responseType, authorizeEndpoint, authority, clientSecret } = globalCtx.config.oauth

        const para = consUrlPara(
            ['client_id', clientId],
            ['response_type', responseType],
            ['redirect_uri', globalCtx.extensionUrl],
            ['nonce', RandomString.generate(32)],
            ['code_challenge', challengeCode],
            ['code_challenge_method', 'S256'],
            ['scope', scopes.join(' ')],
            ['client_secret', clientSecret]
        )

        const uri = Uri.parse(`${authority}${authorizeEndpoint}?${para}`)

        env.openExternal(uri).then(undefined, console.warn)

        return verifyCode
    }

    private ensureScopes(
        scopes: readonly string[] | null | undefined,
        { default: defaultScopes = this.allScopes } = {}
    ): readonly string[] {
        return scopes == null || scopes.length <= 0 ? defaultScopes : scopes
    }

    private parseOauthCallbackUri = (uri: Uri) => new URLSearchParams(`?${uri.query}`).get('code') // authorizationCode

    private async onAccessTokenGranted(
        { accessToken, refreshToken }: TokenInfo,
        {
            cancelToken,
            onStateChange,
            shouldFireSessionAddedEvent = true,
        }: {
            onStateChange?: (state: string) => void
            cancelToken?: CancellationToken
            shouldFireSessionAddedEvent?: boolean
        } = {}
    ) {
        const ifNotCancelledThen = <TR>(f: () => TR): TR | undefined => {
            if (cancelToken?.isCancellationRequested) return
            return f()
        }

        let session: AuthSession | undefined

        try {
            onStateChange?.('正在获取账户信息...')

            const spec = await Oauth.fetchUserInfo(accessToken)

            onStateChange?.('即将完成...')

            session = ifNotCancelledThen(() => {
                if (isUndefined(spec)) return

                return AuthSession.from({
                    accessToken,
                    refreshToken,
                    account: AccountInfo.from(spec),
                    scopes: this.ensureScopes(null),
                    id: `${this.providerId}-${spec.account_id}`,
                })
            })

            const hasStored = await ifNotCancelledThen(() => {
                if (isUndefined(session)) return Promise.resolve(false)

                return globalCtx.secretsStorage.store(this.sessionStorageKey, JSON.stringify([session])).then(
                    () => true,
                    () => false
                )
            })

            ifNotCancelledThen(() => {
                if (!hasStored || isUndefined(session) || !shouldFireSessionAddedEvent) return

                return this._sessionChangeEmitter.fire({
                    added: [session],
                    removed: undefined,
                    changed: undefined,
                })
            })
        } finally {
            if (session != null && cancelToken?.isCancellationRequested) await this.removeSession(session.id)
        }

        if (session == null) throw new Error('Failed to create session')

        return session
    }
}

export const authProvider = new AuthProvider()

class LegacyTokenStore {
    static getAccessToken = () =>
        globalCtx.storage.get<Optional<{ authorizationInfo?: TokenInfo }>>('user')?.authorizationInfo?.accessToken

    static remove = () => globalCtx.storage.update('user', undefined).then(undefined, console.error)
}
