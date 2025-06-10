declare const CNBLOGS_CLIENTID: string
declare const CNBLOGS_CLIENTSECRET: string

export const isDevEnv = () => process.env.NODE_ENV === 'Development'

export namespace ExtConst {
    export const EXT_NAME = 'vscode-cnb'
    export const EXT_PUBLISHER = 'cnblogs'

    export const EXT_SESSION_STORAGE_KEY = 'cnblogs.sessions'

    export const CLIENT_ID = CNBLOGS_CLIENTID
    export const CLIENT_SEC = CNBLOGS_CLIENTSECRET

    export namespace ApiBase {
        export const BLOG_BACKEND = 'https://write.cnblogs.com/api'
        export const OPENAPI = 'https://api.cnblogs.com/api'
        export const OAUTH = 'https://oauth.cnblogs.com'
    }

    export const OAUTH_SCOPES = ['openid', 'profile', 'CnBlogsApi', 'CnblogsAdminApi']
}

export function extName(tail: any) {
    return `${ExtConst.EXT_NAME}${tail}`
}
