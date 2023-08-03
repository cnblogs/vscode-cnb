import { AccountManagerNg } from '@/auth/account-manager'
import got, { BeforeRequestHook } from 'got'
import { isString } from 'lodash-es'
import { ReqHeaderKey } from '@/infra/http/infra/header'
import { bearer } from '@/infra/http/infra/auth-type'

const bearerTokenHook: BeforeRequestHook = async opt => {
    const { headers } = opt
    const headerKeys = Object.keys(headers)

    const keyIndex = headerKeys.findIndex(x => x.toLowerCase() === ReqHeaderKey.AUTHORIZATION.toLowerCase())

    if (keyIndex < 0) {
        const token = await AccountManagerNg.acquireToken()

        if (isString(token)) headers[ReqHeaderKey.AUTHORIZATION] = bearer(token)
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
