/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInfo } from '@/models/token-info'
import { AccountInfo } from '@/auth/account-info'
import { convertObjectKeysToCamelCase } from '@/services/fetch-json-response-to-camel-case'
import { globalCtx } from '@/services/global-state'
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

export class OauthApi {
    async fetchToken({
        codeVerifier,
        authorizationCode,
        cancellationToken,
    }: {
        codeVerifier: string
        authorizationCode: string
        cancellationToken?: CancellationToken
    }): Promise<TokenInfo> {
        const abortControl = new AbortController()
        if (cancellationToken?.isCancellationRequested) abortControl.abort()
        cancellationToken?.onCancellationRequested(() => abortControl.abort())

        const url = globalCtx.config.oauth.authority + globalCtx.config.oauth.tokenEndpoint
        const { clientId, clientSecret } = globalCtx.config.oauth

        const res = await got.post<TokenInfo>(url, {
            form: {
                code: authorizationCode,
                code_verifier: codeVerifier,
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

    async fetchUserInfo(
        token: string,
        { cancellationToken }: { cancellationToken?: CancellationToken | null } = {}
    ): Promise<UserInfoSpec> {
        const { authority, userInfoEndpoint } = globalCtx.config.oauth
        const abortController = new AbortController()

        if (cancellationToken?.isCancellationRequested) abortController.abort()
        const cancellationSubscribe = cancellationToken?.onCancellationRequested(() => abortController.abort())

        const { body } = await got<UserInfoSpec>(`${authority}${userInfoEndpoint}`, {
            method: 'GET',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Authorization: `Bearer ${token}` },
            signal: abortController.signal,
            responseType: 'json',
        }).finally(() => {
            cancellationSubscribe?.dispose()
        })

        return body
    }

    async revoke(accessToken: string): Promise<boolean> {
        const { clientId, revocationEndpoint, authority } = globalCtx.config.oauth

        const body = new URLSearchParams([
            ['client_id', clientId],
            ['token', accessToken],
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
