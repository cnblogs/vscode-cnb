/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInfo } from '@/model/token-info'
import { globalCtx } from '@/ctx/global-ctx'
import { Alert } from '@/infra/alert'
import { OauthReq } from '@/wasm'
import { ExtConst } from '@/ctx/ext-const'

function getAuthedOauthReq() {
    return new OauthReq(ExtConst.CLIENT_ID, ExtConst.CLIENT_SEC)
}

export namespace Oauth {
    export async function getToken(verifyCode: string, authCode: string) {
        const req = getAuthedOauthReq()
        try {
            const resp = await req.getToken(authCode, verifyCode, globalCtx.extUrl)
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
