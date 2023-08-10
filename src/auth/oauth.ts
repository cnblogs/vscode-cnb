/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInfo } from '@/model/token-info'
import { globalCtx } from '@/ctx/global-ctx'
import { Alert } from '@/infra/alert'
import { OauthReq } from '@/wasm'

function getAuthedOauthReq() {
    const clientId = globalCtx.config.oauth.clientId
    const clientSec = globalCtx.config.oauth.clientSecret
    return new OauthReq(clientId, clientSec)
}

export namespace Oauth {
    export async function getToken(verifyCode: string, authCode: string) {
        const req = getAuthedOauthReq()
        const callback_url = globalCtx.extensionUrl
        try {
            const resp = await req.getToken(authCode, verifyCode, callback_url)
            return TokenInfo.fromResp(resp)
        } catch (e) {
            void Alert.err(`获取 Token 失败: ${<string>e}`)
            throw e
        }
    }

    export async function revokeToken(token: string) {
        const req = getAuthedOauthReq()
        try {
            await req.revokeToken(token)
            return true
        } catch (e) {
            void Alert.err(`撤销 Token 失败: ${<string>e}`)
            return false
        }
    }
}
