export interface IConfig {
    oauth: {
        authority: string;
        tokenEndpoint: string;
        authorizeEndpoint: string;
        userInfoEndpoint: string;
        clientId: string;
        responseType: string;
        scope: string;
        revocationEndpoint: string;
    };
    apiBaseUrl: string;
}

export const isDev = () => {
    return process.env.NODE_ENV === 'Development';
};

export const defaultConfig: IConfig = {
    oauth: {
        authority: 'https://oauth.cnblogs.com',
        tokenEndpoint: '/connect/token',
        authorizeEndpoint: '/connect/authorize',
        userInfoEndpoint: '/connect/userinfo',
        clientId: 'vscode-cnb',
        responseType: 'code',
        scope: 'openid profile CnBlogsApi CnblogsAdminApi',
        revocationEndpoint: '/connection/revocation',
    },
    apiBaseUrl: 'https://i.cnblogs.com',
};

export const devConfig = Object.assign({}, defaultConfig, {
    oauth: Object.assign({}, defaultConfig.oauth, {
        authority: 'https://my-oauth.cnblogs.com',
    }),
    apiBaseUrl: 'https://admin.cnblogs.com',
});
