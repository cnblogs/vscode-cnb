import { accountManager } from '@/auth/account-manager'
import { Oauth } from '@/services/oauth.api'
import got, { BeforeRequestHook } from 'got'
import { isString } from 'lodash-es'

const bearerTokenHook: BeforeRequestHook = async opt => {
    const { headers } = opt
    const headerKeys = Object.keys(headers)

    const keyIndex = headerKeys.findIndex(x => x.toLowerCase() === Oauth.AuthHeaderKey.toLowerCase())

    if (keyIndex < 0) {
        const token = await accountManager.acquireToken()

        if (isString(token)) headers[Oauth.AuthHeaderKey] = `Bearer ${token}`
    }
}

const httpClient = got.extend({
    hooks: {
        beforeRequest: [bearerTokenHook],
    },
    throwHttpErrors: true,
    https: { rejectUnauthorized: false },
})

export * from 'got'
export { got }
export default httpClient
