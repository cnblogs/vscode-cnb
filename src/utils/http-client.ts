import { accountManager } from '@/authentication/account-manager';
import { AuthorizationHeaderKey } from '@/utils/constants';
import got, { BeforeRequestHook } from 'got';
import { isString } from 'lodash-es';

const bearerTokenHook: BeforeRequestHook = async opt => {
    const { headers } = opt;

    if (Object.keys(headers).findIndex(x => x.toLowerCase() === AuthorizationHeaderKey.toLowerCase()) < 0) {
        const token = await accountManager.acquireToken().catch((reason: unknown) => ({ reason }));
        if (isString(token)) headers[AuthorizationHeaderKey] = `Bearer ${token}`;
    }
};

const httpClient = got.extend({
    hooks: {
        beforeRequest: [bearerTokenHook],
    },
    throwHttpErrors: true,
    https: { rejectUnauthorized: false },
});

const gotWithBuffer = got.extend({
    hooks: {
        beforeRequest: [bearerTokenHook],
    },
    throwHttpErrors: true,
    https: { rejectUnauthorized: false },
    responseType: 'buffer',
});

export { got, gotWithBuffer };
export * from 'got';
export default httpClient;
