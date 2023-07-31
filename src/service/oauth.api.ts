/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInfo } from '@/model/token-info'
import { AccountInfo } from '@/auth/account-info'
import { globalCtx } from '@/ctx/global-ctx'
import { objectKeys2camelCase } from '@/infra/convert/object-keys-to-camel-case'
import { consReqHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { Req } from '@/infra/http/req'
import { AuthedReq } from '@/infra/http/authed-req'
import { Alert } from '@/infra/alert'
import { consUrlPara } from '@/infra/http/infra/url'

export type UserInfoSpec = Pick<AccountInfo, 'sub' | 'website' | 'name'> & {
    readonly blog_id: string
    readonly account_id: string
    readonly picture: string
}

export namespace Oauth {
    import ContentType = ReqHeaderKey.ContentType

    export async function fetchToken(verifyCode: string, authCode: string) {
        const url = globalCtx.config.oauth.authority + globalCtx.config.oauth.tokenEndpoint
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appX3wfu])

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
            return <TokenInfo>objectKeys2camelCase(JSON.parse(resp))
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.log(`获取 Token 失败: ${e}`)
            throw e
        }
    }

    export async function fetchUserInfo(token: string) {
        const { authority, userInfoEndpoint } = globalCtx.config.oauth

        const url = `${authority}${userInfoEndpoint}`
        const header = consReqHeader([ReqHeaderKey.AUTHORIZATION, `Bearer ${token}`])
        const resp = await Req.get(url, header)

        return JSON.parse(resp) as UserInfoSpec
    }

    export async function revokeToken(token: string) {
        // FIX: revoke url is deprecated
        const { clientId, revocationEndpoint, authority } = globalCtx.config.oauth

        const url = `${authority}${revocationEndpoint}`
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appX3wfu])

        const body = consUrlPara(['client_id', clientId], ['token', token], ['token_type_hint', 'access_token'])

        try {
            await AuthedReq.post(url, header, body)
            return true
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`Revoke token 失败: ${e}`)
            return false
        }
    }
}
