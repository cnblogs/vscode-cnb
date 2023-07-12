import { CnblogsAuthenticationSession } from '@/authentication/session'
import { generateCodeChallenge } from '@/services/code-challenge.service'
import { isArray, isUndefined } from 'lodash-es'
import {
    authentication,
    AuthenticationProvider,
    AuthenticationProviderAuthenticationSessionsChangeEvent,
    CancellationToken,
    CancellationTokenSource,
    Disposable,
    env,
    EventEmitter,
    ProgressLocation,
    Uri,
    window,
} from 'vscode'
import { globalContext } from '../services/global-state'
import RandomString from 'randomstring'
import { OauthApi } from '@/services/oauth.api'
import extensionUriHandler from '@/utils/uri-handler'
import { AlertService } from '@/services/alert.service'
import { CnblogsAccountInformation } from '@/authentication/account-information'
import { TokenInformation } from '@/models/token-information'
import { Optional } from 'utility-types'

export class CnblogsAuthenticationProvider implements AuthenticationProvider, Disposable {
    static readonly providerId = 'cnblogs'
    static readonly providerName = '博客园Cnblogs'

    private static _instance?: CnblogsAuthenticationProvider | null

    readonly providerId = CnblogsAuthenticationProvider.providerId
    readonly providerName = CnblogsAuthenticationProvider.providerName

    protected readonly sessionStorageKey = `${CnblogsAuthenticationProvider.providerId}.sessions`
    protected readonly allScopes = globalContext.config.oauth.scope.split(' ')

    private _allSessions?: CnblogsAuthenticationSession[] | null
    private _oauthClient?: OauthApi | null
    private readonly _sessionChangeEmitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>()
    private readonly _disposable: Disposable

    private constructor() {
        this._disposable = Disposable.from(
            this._sessionChangeEmitter,
            authentication.registerAuthenticationProvider(
                CnblogsAuthenticationProvider.providerId,
                CnblogsAuthenticationProvider.providerName,
                this,
                {
                    supportsMultipleAccounts: false,
                }
            ),
            this.onDidChangeSessions(() => (this._allSessions = null))
        )
    }

    static get instance() {
        return (this._instance ??= new CnblogsAuthenticationProvider())
    }

    get onDidChangeSessions() {
        return this._sessionChangeEmitter.event
    }

    protected get context() {
        return globalContext.extensionContext
    }

    protected get secretStorage() {
        return globalContext.secretsStorage
    }

    protected get config() {
        return globalContext.config
    }

    protected get oauthClient() {
        return (this._oauthClient ??= new OauthApi())
    }

    async getSessions(scopes?: readonly string[] | undefined): Promise<readonly CnblogsAuthenticationSession[]> {
        const sessions = await this.getAllSessions()
        const parsedScopes = this.ensureScopes(scopes)
        return isArray(sessions)
            ? sessions
                  .map(x => CnblogsAuthenticationSession.parse(x))
                  .filter(({ scopes: sessionScopes }) => parsedScopes.every(x => sessionScopes.includes(x)))
            : []
    }

    createSession(scopes: readonly string[]): Thenable<CnblogsAuthenticationSession> {
        const parsedScopes = this.ensureScopes(scopes)
        return window.withProgress<CnblogsAuthenticationSession>(
            {
                title: `${globalContext.displayName} - 登录`,
                cancellable: true,
                location: ProgressLocation.Notification,
            },
            (progress, cancellationToken) => {
                let disposable: Disposable | undefined | null

                return new Promise<CnblogsAuthenticationSession>((resolve, reject) => {
                    const cancellationSource = new CancellationTokenSource()
                    let isTimeout = false
                    const timeoutId = setTimeout(() => {
                        clearTimeout(timeoutId)
                        isTimeout = true
                        cancellationSource.cancel()
                    }, /* 30min */ 1800000)
                    const { codeVerifier } = this.signInWithBrowser({ scopes: parsedScopes })
                    progress.report({ message: '等待用户在浏览器中进行授权...' })

                    disposable = Disposable.from(
                        cancellationSource,
                        extensionUriHandler.onUri(uri => {
                            if (cancellationSource.token.isCancellationRequested) return

                            const { authorizationCode } = this.parseOauthCallbackUri(uri)
                            if (!authorizationCode) return

                            progress.report({ message: '已获得授权, 正在获取令牌...' })

                            this.oauthClient
                                .fetchToken({
                                    codeVerifier,
                                    authorizationCode,
                                    cancellationToken: cancellationSource.token,
                                })
                                .then(token =>
                                    this.onAccessTokenGranted(token, {
                                        cancellationToken: cancellationSource.token,
                                        onStateChange(state) {
                                            progress.report({ message: state })
                                        },
                                    })
                                )
                                .then(resolve)
                                .catch(reject)
                        }),
                        cancellationToken.onCancellationRequested(() => cancellationSource.cancel()),
                        cancellationSource.token.onCancellationRequested(() => {
                            reject(`${isTimeout ? '由于超时, ' : ''}登录操作已取消`)
                        })
                    )
                })
                    .catch(reason => Promise.reject(AlertService.error(`${reason}`)))
                    .finally(() => {
                        disposable?.dispose()
                    })
            }
        )
    }

    async removeSession(sessionId: string): Promise<void> {
        const data = (await this.getAllSessions()).reduce<{
            removed: CnblogsAuthenticationSession[]
            keep: CnblogsAuthenticationSession[]
        }>(
            (p, c) => {
                c.id === sessionId ? p.removed.push(c) : p.keep.push(c)
                return p
            },
            { removed: [], keep: [] }
        )
        await this.context.secrets.store(this.sessionStorageKey, JSON.stringify(data.keep))
        this._sessionChangeEmitter.fire({ removed: data.removed, added: undefined, changed: undefined })
    }

    dispose() {
        this._disposable.dispose()
    }

    protected async getAllSessions(): Promise<CnblogsAuthenticationSession[]> {
        const legacyToken = LegacyTokenStore.getAccessToken()
        if (legacyToken != null) {
            await this.onAccessTokenGranted({ accessToken: legacyToken }, { shouldFireSessionAddedEvent: false })
                .then(undefined, console.warn)
                .finally(() => LegacyTokenStore.remove())
        }

        if (this._allSessions == null || this._allSessions.length <= 0) {
            const sessions = JSON.parse((await this.secretStorage.get(this.sessionStorageKey)) ?? '[]') as
                | CnblogsAuthenticationSession[]
                | null
                | undefined
                | unknown
            this._allSessions = isArray(sessions) ? sessions.map(x => CnblogsAuthenticationSession.parse(x)) : []
        }

        return this._allSessions
    }

    private signInWithBrowser({ scopes }: { scopes: readonly string[] }) {
        const { codeVerifier, codeChallenge } = generateCodeChallenge()
        const { clientId, responseType, authorizeEndpoint, authority, clientSecret } = this.config.oauth

        const search = new URLSearchParams([
            ['client_id', clientId],
            ['response_type', responseType],
            ['redirect_uri', globalContext.extensionUrl],
            ['nonce', RandomString.generate(32)],
            ['code_challenge', codeChallenge],
            ['code_challenge_method', 'S256'],
            ['scope', scopes.join(' ')],
            ['client_secret', clientSecret],
        ])
        env.openExternal(Uri.parse(`${authority}${authorizeEndpoint}?${search.toString()}`)).then(
            undefined,
            console.warn
        )
        return { codeVerifier }
    }

    private ensureScopes(
        scopes: readonly string[] | null | undefined,
        { default: defaultScopes = this.allScopes } = {}
    ): readonly string[] {
        return scopes == null || scopes.length <= 0 ? defaultScopes : scopes
    }

    private parseOauthCallbackUri(uri: Uri) {
        const authorizationCode = new URLSearchParams(`?${uri.query}`).get('code')
        return { authorizationCode }
    }

    private async onAccessTokenGranted(
        { accessToken, refreshToken }: TokenInformation,
        {
            cancellationToken,
            onStateChange,
            shouldFireSessionAddedEvent = true,
        }: {
            onStateChange?: (state: string) => void
            cancellationToken?: CancellationToken
            shouldFireSessionAddedEvent?: boolean
        } = {}
    ) {
        const run = <TResult = unknown>(func: () => TResult, predicate = () => true): TResult | undefined =>
            cancellationToken?.isCancellationRequested !== true && predicate() ? func() : undefined

        let session: CnblogsAuthenticationSession | undefined
        try {
            onStateChange?.('正在获取账户信息...')
            const userInfo = await run(() =>
                this.oauthClient.fetchUserInformation(accessToken, {
                    cancellationToken: cancellationToken,
                })
            )

            onStateChange?.('即将完成...')
            session = run(() =>
                isUndefined(userInfo)
                    ? undefined
                    : CnblogsAuthenticationSession.parse({
                          accessToken,
                          refreshToken,
                          account: CnblogsAccountInformation.parse(userInfo),
                          scopes: this.ensureScopes(null),
                          id: `${this.providerId}-${userInfo.account_id}`,
                      })
            )
            const hasStored = await run(() =>
                isUndefined(session)
                    ? Promise.resolve(false)
                    : this.secretStorage.store(this.sessionStorageKey, JSON.stringify([session])).then(
                          () => true,
                          () => false
                      )
            )
            run(
                () =>
                    isUndefined(session) || !shouldFireSessionAddedEvent
                        ? undefined
                        : this._sessionChangeEmitter.fire({
                              added: [session],
                              removed: undefined,
                              changed: undefined,
                          }),
                () => hasStored === true
            )
        } finally {
            if (session != null && cancellationToken?.isCancellationRequested) await this.removeSession(session.id)
        }
        if (session == null) throw new Error('Failed to create session')
        return session
    }
}

class LegacyTokenStore {
    private static readonly _key = 'user'

    static getAccessToken() {
        return globalContext.storage.get<Optional<{ authorizationInfo?: TokenInformation }>>(this._key)
            ?.authorizationInfo?.accessToken
    }

    static remove() {
        globalContext.storage.update(this._key, undefined).then(undefined, console.error)
    }
}
