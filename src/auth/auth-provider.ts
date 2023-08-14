import { AuthSession } from '@/auth/auth-session'
import { genVerifyChallengePair } from '@/service/code-challenge'
import {
    authentication,
    AuthenticationProvider,
    AuthenticationProviderAuthenticationSessionsChangeEvent as APASCE,
    CancellationTokenSource,
    Disposable,
    env,
    EventEmitter,
    ProgressLocation,
    Uri,
    window,
} from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'
import { Oauth } from '@/auth/oauth'
import { extUriHandler } from '@/infra/uri-handler'
import { AccountInfo } from '@/auth/account-info'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { RsRand } from '@/wasm'
import { Alert } from '@/infra/alert'
import { LocalState } from '@/ctx/local-state'

async function browserSignIn(challengeCode: string, scopes: string[]) {
    const { clientId, responseType, authRoute, authority, clientSecret } = globalCtx.config.oauth

    const para = consUrlPara(
        ['client_id', clientId],
        ['client_secret', clientSecret],
        ['response_type', responseType],
        ['nonce', RsRand.string(32)],
        ['code_challenge', challengeCode],
        ['code_challenge_method', 'S256'],
        ['scope', scopes.join(' ')],
        ['redirect_uri', globalCtx.extUrl]
    )

    const uri = Uri.parse(`${authority}${authRoute}?${para}`)

    try {
        await env.openExternal(uri)
    } catch (e) {
        void Alert.err(`重定向失败: ${<string>e}`)
    }
}

export class AuthProvider implements AuthenticationProvider, Disposable {
    readonly providerId = 'cnblogs'
    readonly providerName = '博客园Cnblogs'

    protected readonly sessionStorageKey = `${this.providerId}.sessions`
    protected readonly allScopes = globalCtx.config.oauth.scope.split(' ')

    private _allSessions?: AuthSession[] | null

    private readonly _sessionChangeEmitter = new EventEmitter<APASCE>()
    private readonly _disposable = Disposable.from(
        this._sessionChangeEmitter,
        authentication.registerAuthenticationProvider(this.providerId, this.providerName, this, {
            supportsMultipleAccounts: false,
        }),
        this.onDidChangeSessions(() => {
            this._allSessions = null
        })
    )

    get onDidChangeSessions() {
        return this._sessionChangeEmitter.event
    }

    async getSessions(scopes?: string[]): Promise<readonly AuthSession[]> {
        const sessions = await this.getAllSessions()
        const parsedScopes = this.ensureScopes(scopes)

        return sessions.filter(({ scopes: sessionScopes }) => parsedScopes.every(x => sessionScopes.includes(x)))
    }

    createSession(scopes: string[]): Thenable<AuthSession> {
        const parsedScopes = this.ensureScopes(scopes)
        const options = {
            title: `${globalCtx.displayName} - 登录`,
            cancellable: true,
            location: ProgressLocation.Notification,
        }

        const cancelTokenSrc = new CancellationTokenSource()

        let isTimeout = false

        const timeoutId = setTimeout(
            () => {
                clearTimeout(timeoutId)
                isTimeout = true
                cancelTokenSrc.cancel()
            },
            30 * 60 * 1000
        ) // 30 min

        return window.withProgress(options, async (progress, cancelToken) => {
            progress.report({ message: '等待用户在浏览器中进行授权...' })

            cancelToken.onCancellationRequested(() => cancelTokenSrc.cancel())

            const [verifyCode, challengeCode] = genVerifyChallengePair()

            const fut = new Promise<AuthSession>((resolve, reject) => {
                cancelTokenSrc.token.onCancellationRequested(() => {
                    reject(`${isTimeout ? '由于超时, ' : ''}登录操作已取消`)
                })

                const onUri = async (uri: Uri) => {
                    progress.report({ message: '已授权, 正在获取 Token...' })

                    const authCode = new URLSearchParams(`?${uri.query}`).get('code')
                    if (authCode == null) {
                        reject('授权失败: 授权码异常')
                        extUriHandler.reset()
                        return
                    }

                    try {
                        const token = await Oauth.getToken(verifyCode, authCode)
                        const authSession = await this.onAccessTokenGranted(token.accessToken, {
                            onStateChange(state) {
                                progress.report({ message: state })
                            },
                        })

                        resolve(authSession)
                    } catch (e) {
                        reject(e)
                    } finally {
                        extUriHandler.reset()
                    }
                }

                extUriHandler.onUri(onUri)
            })

            await browserSignIn(challengeCode, parsedScopes)

            return fut
        })
    }

    async removeSession(sessionId: string): Promise<void> {
        const sessions = await this.getAllSessions()
        const data = sessions.reduce(
            ({ remove, keep }, s) => {
                if (s.id === sessionId) remove.push(s)
                else keep.push(s)
                return { remove, keep }
            },
            { remove: <AuthSession[]>[], keep: <AuthSession[]>[] }
        )
        await LocalState.setSecret(this.sessionStorageKey, JSON.stringify(data.keep))
        this._sessionChangeEmitter.fire({ removed: data.remove, added: undefined, changed: undefined })
    }

    async onAccessTokenGranted(
        accessToken: string,
        {
            onStateChange,
            shouldFireSessionAddedEvent = true,
        }: {
            onStateChange?: (state: string) => void
            shouldFireSessionAddedEvent?: boolean
        } = {}
    ) {
        onStateChange?.('正在获取账户信息...')

        const accountInfo = await AccountInfo.get(accessToken)
        if (accountInfo === undefined) throw Error('用户信息获取失败')

        onStateChange?.('即将完成...')

        const session = new AuthSession(
            accountInfo,
            `${this.providerId}-${accountInfo.userInfo.SpaceUserID}`,
            accessToken,
            this.ensureScopes(null)
        )
        await LocalState.setSecret(this.sessionStorageKey, JSON.stringify([session]))

        if (!shouldFireSessionAddedEvent) return session

        this._sessionChangeEmitter.fire({
            added: [session],
            removed: undefined,
            changed: undefined,
        })

        return session
    }

    dispose() {
        this._disposable.dispose()
    }

    protected async getAllSessions(): Promise<AuthSession[]> {
        if (this._allSessions == null || this._allSessions.length <= 0) {
            const storage = await LocalState.getSecret(this.sessionStorageKey)
            const sessions = JSON.parse(storage ?? '[]') as AuthSession[] | null | undefined

            if (Array.isArray(sessions)) this._allSessions = sessions
            else this._allSessions = []
        }

        return this._allSessions
    }

    private ensureScopes(
        scopes: string[] | null | undefined,
        { default: defaultScopes = this.allScopes } = {}
    ): string[] {
        return scopes == null || scopes.length <= 0 ? defaultScopes : scopes
    }
}

export const authProvider = new AuthProvider()
