import { globalCtx } from '@/ctx/global-ctx'
import { window, authentication, AuthenticationGetSessionOptions as AuthGetSessionOpt } from 'vscode'
import { accountViewDataProvider } from '@/tree-view/provider/account-view-data-provider'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { Oauth } from '@/auth/oauth'
import { authProvider } from '@/auth/auth-provider'
import { AuthSession } from '@/auth/auth-session'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { Alert } from '@/infra/alert'
import { execCmd } from '@/infra/cmd'

let authSession: AuthSession | null = null

authProvider.onDidChangeSessions(async ({ added }) => {
    authSession = null
    if (added != null && added.length > 0) await AuthManager.ensureSession()

    await AuthManager.updateAuthStatus()

    accountViewDataProvider.fireTreeDataChangedEvent()
    postDataProvider.fireTreeDataChangedEvent(undefined)
    postCategoryDataProvider.fireTreeDataChangedEvent()

    BlogExportProvider.optionalInstance?.refreshRecords({ force: false, clearCache: true }).catch(console.warn)
})

export namespace AuthManager {
    export function isAuthed() {
        return authSession !== null
    }

    export function getUserInfo() {
        return authSession?.account.userInfo
    }

    export async function ensureSession(opt?: AuthGetSessionOpt) {
        let session
        try {
            const result = await authentication.getSession(authProvider.providerId, [], opt)
            if (result === undefined) session = null
            // TODO: need better impl
            else session = <AuthSession>result
        } catch (e) {
            void Alert.err(`创建/获取 Session 失败: ${<string>e}`)
            session = null
        }

        if (session != null && session.account.userInfo.SpaceUserID < 0) {
            authSession = null
            await authProvider.removeSession(session.id)
        } else {
            authSession = session
        }

        return authSession
    }

    export function webLogin() {
        return ensureSession({ createIfNone: false, forceNewSession: true })
    }

    export async function patLogin() {
        const opt = {
            title: '请输入您的个人访问令牌 (PAT)',
            prompt: '您可以从账户设置中获取个人访问令牌:\nhttps://account.cnblogs.com/settings/account/personal-access-token',
            password: true,
        }
        const pat = await window.showInputBox(opt)
        if (pat === undefined) return

        try {
            await authProvider.onAccessTokenGranted(pat)
            await ensureSession()
            await AuthManager.updateAuthStatus()
        } catch (e) {
            void Alert.err(`授权失败: ${<string>e}`)
        }
    }

    export async function logout() {
        if (!AuthManager.isAuthed()) return

        const session = await authentication.getSession(authProvider.providerId, [])

        // WRN: For old version compatibility, **never** remove this line
        await globalCtx.storage.update('user', undefined)

        if (session === undefined) return

        try {
            await Oauth.revokeToken(session.accessToken)
            await authProvider.removeSession(session.id)
        } catch (e: any) {
            void Alert.err(`登出发生错误: ${<string>e}`)
        }
    }

    export async function acquireToken() {
        const session = await ensureSession({ createIfNone: false })

        if (session == null) throw Error('未授权')
        if (session.isExpired) throw Error('授权已过期')

        return session.accessToken
    }

    export async function updateAuthStatus() {
        await AuthManager.ensureSession({ createIfNone: false })
        const isAuthed = AuthManager.isAuthed()

        await execCmd('setContext', `${globalCtx.extName}.isAuthed`, isAuthed)

        if (!isAuthed) return

        await execCmd('setContext', `${globalCtx.extName}.user`, {
            name: AuthManager.getUserInfo()?.DisplayName,
            avatar: AuthManager.getUserInfo()?.Avatar,
        })
    }
}
