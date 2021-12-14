import * as vscode from 'vscode';

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

const config: IConfig = {
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

const devConfig = Object.assign({}, config, {
    oauth: Object.assign({}, config.oauth, {
        authority: 'https://my-oauth.cnblogs.com',
    }),
    apiBaseUrl: 'https://admin.cnblogs.com',
});

export class GlobalManager {
    private static _instance = new GlobalManager();

    private _extensionContext?: vscode.ExtensionContext;
    private _config: IConfig = config;
    private _devConfig: IConfig = devConfig;

    static get instance() {
        return this._instance;
    }

    get secretsStorage() {
        return this._extensionContext?.secrets!;
    }

    get storage() {
        return this._extensionContext?.globalState!;
    }

    get config(): IConfig {
        return isDev() ? this._devConfig : this._config;
    }

    get extensionContext(): vscode.ExtensionContext | undefined {
        return this._extensionContext;
    }
    set extensionContext(v: vscode.ExtensionContext | undefined) {
        this._extensionContext = v;
    }

    get extensionName(): string {
        return this.extensionContext?.extension.packageJSON['name'] ?? '';
    }

    protected constructor() {}
}

export const globalManager = GlobalManager.instance;
