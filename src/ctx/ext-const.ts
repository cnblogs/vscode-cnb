declare const CNBLOGS_CLIENTID: string
declare const CNBLOGS_CLIENTSECRET: string

export class ExtConst {
    static EXT_NAME = 'vscode-cnb'
    static EXT_PUBLISHER = 'cnblogs'

    static EXT_SESSION_STORAGE_KEY = 'cnblogs.sessions'

    static CLIENT_ID = CNBLOGS_CLIENTID
    static CLIENT_SEC = CNBLOGS_CLIENTSECRET

    static ApiBase = class {
        static BLOG_BACKEND = 'https://write.cnblogs.com/api'
        static OPENAPI = 'https://api.cnblogs.com/api'
        static OAUTH = 'https://oauth.cnblogs.com'
    }

    static OAUTH_SCOPES = ['openid', 'profile', 'CnBlogsApi', 'CnblogsAdminApi']

    static isDevEnv = () => process.env.NODE_ENV === 'Development'
}

export function extName(tail: any) {
    return `${ExtConst.EXT_NAME}${tail}`
}
