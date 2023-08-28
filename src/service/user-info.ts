import { Token, UserReq } from '@/wasm'
import { Alert } from '@/infra/alert'
import { AuthManager } from '@/auth/auth-manager'

async function getAuthedUserReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new UserReq(new Token(token, isPatToken))
}

export namespace UserService {
    export async function getInfo() {
        try {
            const req = await getAuthedUserReq()
            return await req.getInfo()
        } catch (e) {
            void Alert.err(`获取用户信息失败: ${<string>e}`)
        }
    }

    export function getInfoWithToken(token: string) {
        try {
            // TODO: need better solution
            const isPatToken = token.length === 64
            const req = new UserReq(new Token(token, isPatToken))

            return req.getInfo()
        } catch (e) {
            void Alert.err(`获取用户信息失败: ${<string>e}`)
        }
    }
}
