import { setCtx } from '@/ctx/global-ctx'
import { authentication, AuthenticationGetSessionOptions as AuthGetSessionOpt } from 'vscode'
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
import { UserService } from '@/service/user.service'
import { isAuthSessionExpired } from '@/auth/is-auth-session-expired'
import { PostListView } from '@/cmd/post-list/post-list-view'

authProvider.onDidChangeSessions(async e => {
    await AuthManager.ensureSession({ createIfNone: false })
    await AuthManager.updateAuthStatus()
    accountViewDataProvider.fireTreeDataChangedEvent()

    await postCategoryDataProvider.refreshAsync()

    if (e.removed != null) postDataProvider.refresh()
    else await PostListView.refresh()

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
        authProvider.useBrowser()
        await login()
    }

    export async function patLogin() {
        authProvider.usePat()
        await login()
    }

    export async function login() {
        const session = await ensureSession({ createIfNone: false, forceNewSession: true })
        if (session !== undefined)
            await LocalState.setSecret(ExtConst.EXT_SESSION_STORAGE_KEY, JSON.stringify([session]))
    }

    export async function logout() {
        if (!(await AuthManager.isAuthed())) return

        try {
            const session = await authentication.getSession(authProvider.providerId, [])
            if (session == null) return
            const token = session.accessToken
            await authProvider.removeSession(session.id)
            await Oauth.revokeToken(token)
        } catch (e) {
            void Alert.err(`登出发生错误: ${<string>e}`)
            throw e
        }
    }

    export async function acquireToken() {
        const session = await ensureSession({ createIfNone: false })

        if (session === undefined) Alert.throwWithWarn('未授权')
        if (isAuthSessionExpired(session)) {
            void Alert.warn('授权已过期，请重新登录')
            await logout()
        }

        return session?.accessToken
    }

    export async function updateAuthStatus() {
        const isAuthed = await AuthManager.isAuthed()
        await setCtx('isAuthed', isAuthed)
        await setCtx('isUnauthorized', !isAuthed)

        if (!isAuthed) return

        const userInfo = await UserService.getUserInfo()
        if (userInfo !== null) {
            await setCtx('user', {
                name: userInfo.displayName,
                avatar: userInfo.avatar,
            })
        }
    }
}
