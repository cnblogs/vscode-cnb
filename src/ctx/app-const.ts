declare const CNBLOGS_CLIENTID: string
declare const CNBLOGS_CLIENTSECRET: string

export const isDevEnv = () => process.env.NODE_ENV === 'Development'

export namespace AppConst {
    export const CLIENT_ID = CNBLOGS_CLIENTID
    export const CLIENT_SEC = CNBLOGS_CLIENTSECRET

    export namespace ApiBase {
        export const BLOG_BACKEND = 'https://i.cnblogs.com/api'
        export const OPENAPI = 'https://api.cnblogs.com/api'
        export const OAUTH = 'https://oauth.cnblogs.com'
    }

    export const OAUTH_SCOPES = ['openid', 'profile', 'CnBlogsApi', 'CnblogsAdminApi']
}
