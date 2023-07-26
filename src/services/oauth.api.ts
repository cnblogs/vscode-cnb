/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInfo } from '@/models/token-info'
import { AccountInfo } from '@/auth/account-info'
import { convertObjectKeysToCamelCase } from '@/services/fetch-json-response-to-camel-case'
import { globalCtx } from '@/services/global-ctx'
import fetch from '@/utils/fetch-client'
import got from '@/utils/http-client'
import { CancellationToken } from 'vscode'
import { AbortController } from 'node-abort-controller'
import { AuthorizationHeaderKey } from '@/utils/constants'

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
                [AuthorizationHeaderKey]: '',
            },
        })

        if (res.statusCode === 200) return convertObjectKeysToCamelCase(res.body)

        throw Error(
            `Failed to request token endpoint, ${res.statusCode}, ${res.statusMessage}, ${res.rawBody.toString()}`
        )
    }

    export async function fetchUserInfo(token: string, cancelToken?: CancellationToken) {
        const { authority, userInfoEndpoint } = globalCtx.config.oauth
        const abortController = new AbortController()

        if (cancelToken?.isCancellationRequested) abortController.abort()

        const cancelSub = cancelToken?.onCancellationRequested(() => abortController.abort())

        const res = await got<UserInfoSpec>(`${authority}${userInfoEndpoint}`, {
            method: 'GET',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Authorization: `Bearer ${token}` },
            signal: abortController.signal,
            responseType: 'json',
        }).finally(() => {
            cancelSub?.dispose()
        })

        return res.body
    }

    export async function revokeToken(token: string) {
        const { clientId, revocationEndpoint, authority } = globalCtx.config.oauth

        const body = new URLSearchParams([
            ['client_id', clientId],
            ['token', token],
            ['token_type_hint', 'access_token'],
        ])
        const url = `${authority}${revocationEndpoint}`
        const res = await fetch(url, {
            method: 'POST',
            body: body,
            headers: [['Content-Type', 'application/x-www-form-urlencoded']],
        })

        return res.ok
    }
}
