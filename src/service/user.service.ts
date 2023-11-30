import { Alert } from '@/infra/alert'
import { AuthManager } from '@/auth/auth-manager'
import { UserInfo } from '@/model/user-info'
import { ExtConst } from '@/ctx/ext-const'
import fetch, { Headers } from 'node-fetch'

export namespace UserService {
    export async function getUserInfo(): Promise<UserInfo> {
        const token = await AuthManager.acquireToken()
        // TODO: need better solution
        const isPatToken = token.length === 64
        return getUserInfoWithToken(token, isPatToken)
    }

    export async function hasBlog(): Promise<boolean> {
        const userInfo = await UserService.getUserInfo()
        return userInfo?.blogApp != null
    }

    export async function getUserInfoWithToken(token: string, isPat: boolean): Promise<UserInfo> {
        const url = `${ExtConst.ApiBase.OPENAPI}/users/v2`

        const headers = new Headers()
        headers.append('authorization', `Bearer ${token}`)
        headers.append('content-type', 'application/json')
        if (isPat) headers.append('authorization-type', 'pat')

        const req = await fetch(url, {
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json',
                'authorization-type': isPat ? 'pat' : '',
            },
        })

        if (!req.ok) {
            const message = `${req.status}: ${req.statusText}`
            void Alert.err(`获取用户信息失败: ${message}`)
            throw new Error(message)
        }

        const userInfo = (await req.json()) as UserInfo

        if (userInfo.userId == null) void Alert.err(`获取用户信息失败: userId is null`)

        if (userInfo.accountId === undefined) void Alert.err(`获取用户信息失败: accountId is undefined`)

        return userInfo
    }
}
