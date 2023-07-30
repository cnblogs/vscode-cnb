/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInfo } from '@/model/token-info'
import { AccountInfo } from '@/auth/account-info'
import { globalCtx } from '@/ctx/global-ctx'
import got from '@/infra/http-client'
import { CancellationToken } from 'vscode'
import { AbortController } from 'node-abort-controller'
import { objectKeysToCamelCase } from '@/infra/convert/object-keys-to-camel-case'
import { consReqHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { Req } from '@/infra/http/req'
import { AuthedReq } from '@/infra/http/authed-req'
import { Alert } from '@/infra/alert'

export type UserInfoSpec = Pick<AccountInfo, 'sub' | 'website' | 'name'> & {
    readonly blog_id: string
    readonly account_id: string
    readonly picture: string
}

export namespace Oauth {
    export async function fetchToken(verifyCode: string, authCode: string, cancelToken?: CancellationToken) {
        const abortControl = new AbortController()
        if (cancelToken?.isCancellationRequested) abortControl.abort()
        cancelToken?.onCancellationRequested(() => abortControl.abort())

        const url = globalCtx.config.oauth.authority + globalCtx.config.oauth.tokenEndpoint
        const { clientId, clientSecret } = globalCtx.config.oauth

        const res = await got.post<TokenInfo>(url, {
            form: {
                code: authCode,
                code_verifier: verifyCode,
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: globalCtx.extensionUrl,
            },
            responseType: 'json',
            signal: abortControl.signal,
            headers: {
                [ReqHeaderKey.AUTHORIZATION]: '',
            },
        })

        if (res.statusCode === 200) return objectKeysToCamelCase(res.body)

        throw Error(
            `Failed to request token endpoint, ${res.statusCode}, ${res.statusMessage}, ${res.rawBody.toString()}`
        )
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
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/x-www-form-urlencoded'])
        const body = JSON.stringify({
            client_id: clientId,
            token: token,
            token_type_hint: 'access_token',
        })

        try {
            await AuthedReq.post(url, body, header)
            return true
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`Revoke token 失败: ${e}`)
            return false
        }
    }
}
