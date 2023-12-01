import { AuthenticationSession as AuthSession, AuthenticationSession } from 'vscode'
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
import { consUrlPara } from '@/infra/http/infra/url-para'
import { RsRand } from '@/wasm'
import { Alert } from '@/infra/alert'
import { LocalState } from '@/ctx/local-state'
import { ExtConst } from '@/ctx/ext-const'
import { UserService } from '@/service/user.service'

async function browserSignIn(challengeCode: string, scopes: string[]) {
    const para = consUrlPara(
        ['client_id', ExtConst.CLIENT_ID],
        ['client_secret', ExtConst.CLIENT_SEC],
        ['response_type', 'code'],
        ['nonce', RsRand.string(32)],
        ['code_challenge', challengeCode],
        ['code_challenge_method', 'S256'],
        ['scope', scopes.join(' ')],
        ['redirect_uri', globalCtx.extUrl]
    )

    const uri = Uri.parse(`${ExtConst.ApiBase.OAUTH}/connect/authorize?${para}`)

    try {
        await env.openExternal(uri)
    } catch (e) {
        void Alert.err(`重定向失败: ${<string>e}`)
    }
}

export class AuthProvider implements AuthenticationProvider, Disposable {
    readonly providerId = 'cnblogs'
    readonly providerName = '博客园Cnblogs'

    private _allSessions: AuthSession[] = []
    private _usePat = false

    private readonly _sessionChangeEmitter = new EventEmitter<APASCE>()
    private readonly _disposable = Disposable.from(
        this._sessionChangeEmitter,
        authentication.registerAuthenticationProvider(this.providerId, this.providerName, this, {
            supportsMultipleAccounts: false,
        }),
        this.onDidChangeSessions(() => {
            this._allSessions = []
        })
    )

    get onDidChangeSessions() {
        return this._sessionChangeEmitter.event
    }

    useBrowser() {
        this._usePat = false
    }

    usePat() {
        this._usePat = true
    }

    async getSessions(scopes?: string[]): Promise<readonly AuthSession[]> {
        const sessions = await this.getAllSessions()
        const parsedScopes = this.ensureScopes(scopes)

        return sessions.filter(({ scopes: sessionScopes }) => parsedScopes.every(x => sessionScopes.includes(x)))
    }

    createSession(scopes: string[]) {
        return this._usePat ? this.createSessionFromPat(scopes) : this.createSessionFromBrowser(scopes)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createSessionFromPat(scopes: string[]) {
        const opt = {
            title: '请输入您的个人访问令牌 (PAT)',
            prompt: '可通过 https://account.cnblos.com/tokens 获取',
            password: true,
            validator: (value: string) => (value.length === 0 ? '个人访问令牌（PAT)不能为空' : ''),
        }

        const pat = await window.showInputBox(opt)
        if ((pat ?? '').length === 0) throw new Error('个人访问令牌（PAT)不能为空')

        return authProvider.onAccessTokenGranted(pat ?? '', true)
    }

    createSessionFromBrowser(scopes: string[]) {
        const parsedScopes = this.ensureScopes(scopes)

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

        const options = {
            title: `博客园客户端 - 登录`,
            cancellable: true,
            location: ProgressLocation.Notification,
        }

        const session = window.withProgress(options, async (progress, cancelToken) => {
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
                        const authSession = await this.onAccessTokenGranted(token, false, state =>
                            progress.report({ message: state })
                        )

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

        return session
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
        await LocalState.setSecret(ExtConst.EXT_SESSION_STORAGE_KEY, JSON.stringify(data.keep))
        this._sessionChangeEmitter.fire({ removed: data.remove, added: undefined, changed: undefined })
    }

    async onAccessTokenGranted(token: string, isPat: boolean, onStateChange?: (state: string) => void) {
        onStateChange?.('正在获取账号信息...')

        const userInfo = await UserService.getUserInfoWithToken(token, isPat)
        if (userInfo == null) {
            const errorMsg = '获取用户信息失败，错误详情: userInfo is null'
            void Alert.warn(errorMsg)
            throw Error(errorMsg)
        }

        if (userInfo.blogApp == null)
            void Alert.warn('您的账号未开通博客，[立即开通](https://account.cnblogs.com/blog-apply)')

        onStateChange?.('即将完成...')

        const { accountId, displayName } = userInfo

        const session = <AuthenticationSession>{
            account: {
                id: new Number(accountId).toString(),
                label: displayName,
            },
            id: `${this.providerId}-${userInfo.accountId}`,
            accessToken: token,
            scopes: this.ensureScopes(null),
        }

        await LocalState.setSecret(ExtConst.EXT_SESSION_STORAGE_KEY, JSON.stringify([session]))

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

    protected async getAllSessions() {
        if (this._allSessions.length === 0) {
            const sessionJsonList = await LocalState.getSecret(ExtConst.EXT_SESSION_STORAGE_KEY)
            this._allSessions = JSON.parse(sessionJsonList ?? '[]') as AuthSession[]
        }

        return this._allSessions
    }

    private ensureScopes(
        scopes: string[] | null | undefined,
        { default: defaultScopes = ExtConst.OAUTH_SCOPES } = {}
    ): string[] {
        return scopes == null || scopes.length <= 0 ? defaultScopes : scopes
    }
}

export const authProvider = new AuthProvider()
