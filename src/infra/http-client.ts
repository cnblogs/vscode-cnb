import { AuthManager } from '@/auth/auth-manager'
import got, { BeforeRequestHook } from 'got'
import { isString } from 'lodash-es'
import { ReqHeaderKey } from '@/infra/http/infra/header'
import { bearer } from '@/infra/http/infra/auth-type'

const bearerTokenHook: BeforeRequestHook = async opt => {
    const { headers } = opt
    const headerKeys = Object.keys(headers)

    const keyIndex = headerKeys.findIndex(x => x.toLowerCase() === ReqHeaderKey.AUTHORIZATION.toLowerCase())

    if (keyIndex < 0) {
        const token = await AuthManager.acquireToken()

        if (isString(token)) headers[ReqHeaderKey.AUTHORIZATION] = bearer(token)

        // TODO: need better solution
        if (token.length === 64) headers[ReqHeaderKey.AUTHORIZATION_TYPE] = 'pat'
    }
}

const httpClient = got.extend({
    hooks: {
        beforeRequest: [bearerTokenHook],
    },
    throwHttpErrors: true,
    https: { rejectUnauthorized: false },
})

export { got }
export * from 'got'
export default httpClient
