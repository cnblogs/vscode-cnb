import { env } from 'process'

export type ExtConst = {
    oauth: {
        authority: string
        tokenRoute: string
        authRoute: string
        userInfoRoute: string
        clientId: string
        clientSecret: string
        responseType: string
        scope: string
        revokeRoute: string
    }
    apiBaseUrl: string
    ingSite: string
    openApiUrl: string
}

export const isDevEnv = () => process.env.NODE_ENV === 'Development'

declare const CNBLOGS_CLIENTID: string
declare const CNBLOGS_CLIENTSECRET: string

export const defaultConfig: ExtConst = {
    oauth: {
        authority: 'https://oauth.cnblogs.com',
        tokenRoute: '/connect/token',
        authRoute: '/connect/authorize',
        userInfoRoute: '/connect/userinfo',
        clientId: CNBLOGS_CLIENTID,
        clientSecret: CNBLOGS_CLIENTSECRET,
        responseType: 'code',
        scope: 'openid profile CnBlogsApi CnblogsAdminApi',
        revokeRoute: '/connect/revocation',
    },
    apiBaseUrl: 'https://i.cnblogs.com',
    ingSite: 'https://ing.cnblogs.com',
    openApiUrl: 'https://api.cnblogs.com',
}

export const devConfig: ExtConst = {
    ...defaultConfig,
    oauth: {
        ...defaultConfig.oauth,
        authority: env.Authority ? env.Authority : 'https://my-oauth.cnblogs.com',
        clientId: env.ClientId ? env.ClientId : 'vscode-cnb',
        clientSecret: env.ClientSecret ? env.ClientSecret : '',
    },
    apiBaseUrl: 'https://admin.cnblogs.com',
    ingSite: 'https://my-ing.cnblogs.com',
    openApiUrl: 'https://my-api.cnblogs.com',
}
