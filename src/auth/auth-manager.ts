import { setCtx } from '@/ctx/global-ctx'
import { authentication, AuthenticationGetSessionOptions as AuthGetSessionOpt, window } from 'vscode'
import { accountViewDataProvider } from '@/tree-view/provider/account-view-data-provider'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { Oauth } from '@/auth/oauth'
import { authProvider } from '@/auth/auth-provider'
import { AuthenticationSession as AuthSession } from 'vscode'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { Alert } from '@/infra/alert'
import { LocalState } from '@/ctx/local-state'
import { ExtConst } from '@/ctx/ext-const'
import { UserService } from '@/service/user-info'
import { isAuthSessionExpired } from '@/auth/is-auth-session-expired'

authProvider.onDidChangeSessions(async () => {
    await AuthManager.ensureSession({ createIfNone: false })
    await AuthManager.updateAuthStatus()

    accountViewDataProvider.fireTreeDataChangedEvent()
    postDataProvider.fireTreeDataChangedEvent()
    postCategoryDataProvider.fireTreeDataChangedEvent()

    await BlogExportProvider.optionalInstance?.refreshRecords({ force: false, clearCache: true })
})

export namespace AuthManager {
    export async function isAuthed() {
        const sessionJsonList = await LocalState.getSecret(ExtConst.EXT_SESSION_STORAGE_KEY)
        const sessionList = JSON.parse(sessionJsonList ?? '[]') as AuthSession[]
        return sessionList.length > 0
    }

    export function ensureSession(opt?: AuthGetSessionOpt) {
        try {
            return authentication.getSession(authProvider.providerId, [], opt)
        } catch (e) {
            throw Error(`创建/获取 Session 失败: ${<string>e}`)
        }
    }

    export async function webLogin() {
        const session = await ensureSession({ createIfNone: false, forceNewSession: true })
        if (session !== undefined)
            await LocalState.setSecret(ExtConst.EXT_SESSION_STORAGE_KEY, JSON.stringify([session]))
    }

    export async function patLogin() {
        const opt = {
            title: '请输入您的个人访问令牌 (PAT)',
            prompt: '可通过 https://account.cnblos.com/tokens 获取',
            password: true,
        }
        const pat = await window.showInputBox(opt)
        if (pat === undefined) return

        try {
            await authProvider.onAccessTokenGranted(pat)
            await AuthManager.updateAuthStatus()
        } catch (e) {
            void Alert.err(`授权失败: ${<string>e}`)
        }
    }

    export async function logout() {
        if (!(await AuthManager.isAuthed())) return

        try {
            const session = await authentication.getSession(authProvider.providerId, [])
            if (session === undefined) return
            await Oauth.revokeToken(session.accessToken)
            await authProvider.removeSession(session.id)
        } catch (e) {
            void Alert.err(`登出发生错误: ${<string>e}`)
        }
    }

    export async function acquireToken() {
        const session = await ensureSession({ createIfNone: false })

        if (session === undefined) throw Error('未授权')
        if (isAuthSessionExpired(session)) throw Error('授权已过期')

        return session.accessToken
    }

    export async function updateAuthStatus() {
        const isAuthed = await AuthManager.isAuthed()

        await setCtx('isAuthed', isAuthed)
        await setCtx('isUnauthorized', !isAuthed)

        if (!isAuthed) return

        const userInfo = await UserService.getInfo()
        if (userInfo !== undefined) {
            await setCtx('user', {
                name: userInfo.display_name,
                avatar: userInfo.avatar,
            })
        }
    }
}
