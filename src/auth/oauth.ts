/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInfo } from '@/model/token-info'
import { globalCtx } from '@/ctx/global-ctx'
import { consHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { Req } from '@/infra/http/req'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { basic } from '@/infra/http/infra/auth-type'
import { RsBase64, UserReq } from '@/wasm'

export type UserInfo = {
    account_id: string
    blog_id: string
    name: string
    picture: string
    sub: string
    website: string
}

function getAuthedUserReq(token: string) {
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new UserReq(token, isPatToken)
}

export namespace Oauth {
    import ContentType = ReqHeaderKey.ContentType

    export async function fetchToken(verifyCode: string, authCode: string) {
        const url = `${globalCtx.config.oauth.authority}${globalCtx.config.oauth.tokenRoute}`
        const header = consHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appX3wfu])

        const body = consUrlPara(
            ['code', authCode],
            ['code_verifier', verifyCode],
            ['grant_type', 'authorization_code'],
            ['client_id', globalCtx.config.oauth.clientId],
            ['client_secret', globalCtx.config.oauth.clientSecret],
            ['redirect_uri', globalCtx.extensionUrl]
        )

        try {
            const resp = await Req.post(url, header, body)
            return TokenInfo.fromResp(resp)
        } catch (e) {
            void Alert.err(`获取 Token 失败: ${<string>e}`)
            throw e
        }
    }

    export async function getUserInfo(token: string) {
        try {
            const req = getAuthedUserReq(token)
            const resp = await req.getInfo()
            return <UserInfo>JSON.parse(resp)
        } catch (e) {
            void Alert.err(`获取用户信息失败: ${<string>e}`)
        }
    }

    export async function revokeToken(token: string) {
        // FIX: revoke url is deprecated
        const { clientId, clientSecret, revokeRoute, authority } = globalCtx.config.oauth

        const url = `${authority}${revokeRoute}`

        const credentials = RsBase64.encode(`${clientId}:${clientSecret}`)
        const header = consHeader(
            [ReqHeaderKey.AUTHORIZATION, basic(credentials)],
            [ReqHeaderKey.CONTENT_TYPE, ContentType.appX3wfu]
        )

        const body = consUrlPara(['client_id', clientId], ['token', token], ['token_type_hint', 'refresh_token'])

        try {
            await Req.post(url, header, body)
            return true
        } catch (e) {
            void Alert.err(`撤销 Token 失败: ${<string>e}`)
            return false
        }
    }
}
