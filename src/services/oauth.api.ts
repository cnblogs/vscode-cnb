/* eslint-disable @typescript-eslint/naming-convention */
import { TokenInformation } from '@/models/token-information'
import { CnblogsAccountInformation } from '@/authentication/account-information'
import { convertObjectKeysToCamelCase } from '@/services/fetch-json-response-to-camel-case'
import { globalContext } from '@/services/global-state'
import fetch from '@/utils/fetch-client'
import got from '@/utils/http-client'
import { CancellationToken } from 'vscode'
import { AbortController } from 'node-abort-controller'
import { AuthorizationHeaderKey } from '@/utils/constants'

export type UserInformationSpec = Pick<CnblogsAccountInformation, 'sub' | 'website' | 'name'> & {
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
    }): Promise<TokenInformation> {
        const abortControl = new AbortController()
        if (cancellationToken?.isCancellationRequested) abortControl.abort()
        cancellationToken?.onCancellationRequested(() => abortControl.abort())

        const url = globalContext.config.oauth.authority + globalContext.config.oauth.tokenEndpoint
        const { clientId, clientSecret } = globalContext.config.oauth

        const res = await got.post<TokenInformation>(url, {
            form: {
                code: authorizationCode,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: globalContext.extensionUrl,
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

    async fetchUserInformation(
        token: string,
        { cancellationToken }: { cancellationToken?: CancellationToken | null } = {}
    ): Promise<UserInformationSpec> {
        const { authority, userInfoEndpoint } = globalContext.config.oauth
        const abortController = new AbortController()

        if (cancellationToken?.isCancellationRequested) abortController.abort()
        const cancellationSubscribe = cancellationToken?.onCancellationRequested(() => abortController.abort())

        const { body } = await got<UserInformationSpec>(`${authority}${userInfoEndpoint}`, {
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
        const { clientId, revocationEndpoint, authority } = globalContext.config.oauth

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
