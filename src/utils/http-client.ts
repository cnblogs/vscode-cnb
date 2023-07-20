import { accountManager } from '@/auth/account-manager'
import got, { BeforeRequestHook } from 'got'
import { isString } from 'lodash-es'
import { Oauth } from '@/services/oauth.api'

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

export { got }
export * from 'got'
export default httpClient
