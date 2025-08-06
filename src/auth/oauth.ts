import { globalCtx } from '@/ctx/global-ctx'
import { Alert } from '@/infra/alert'
import { OauthReq } from '@/wasm'
import { ExtConst } from '@/ctx/ext-const'

function getAuthedOauthReq() {
    return new OauthReq(ExtConst.CLIENT_ID, ExtConst.CLIENT_SEC)
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Oauth {
    export function getToken(verifyCode: string, authCode: string) {
        const req = getAuthedOauthReq()
        try {
            return req.getToken(authCode, verifyCode, globalCtx.extUrl)
        } catch (e) {
            void Alert.err(`获取 Token 失败: ${e as string}`)
            throw e
        }
    }

    export function revokeToken(token: string) {
        try {
            const req = getAuthedOauthReq()
            return req.revokeToken(token)
        } catch (e) {
            void Alert.err(`撤销 Token 失败: ${e as string}`)
        }
    }
}
