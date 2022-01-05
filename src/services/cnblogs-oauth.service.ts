import { UserAuthorizationInfo } from './../models/user-settings';
import { convertObjectKeysToCamelCase } from './fetch-json-response-to-camel-case';
import * as express from 'express';
import { Server } from 'http';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { globalState } from './global-state';
import { Disposable } from 'vscode';

export class CnblogsOAuthService extends Disposable {
    listenPort = 41385;
    private _app: express.Express;
    private _server?: Server;
    private _codeVerifier = '';

    get listenUrl() {
        return `http://localhost:${this.listenPort}`;
    }

    constructor() {
        super(() => {
            if (this._server && this._server.listening) {
                this._server?.close();
            }
        });
        this._app = express();
    }

    startListenAuthorizationCodeCallback(
        codeVerifier: string,
        callback: (authorizationInfo?: UserAuthorizationInfo, error?: any) => void | Promise<void>
    ) {
        if (this._server) {
            this._server.close();
        }
        this._server = this._app.listen(this.listenPort);
        this._codeVerifier = codeVerifier;
        this._app.get(['/', '/callback'], async (req, res) => {
            const authorizationInfo = await this.handleOAuthRedirect(req, res);
            if (authorizationInfo instanceof UserAuthorizationInfo) {
                callback(authorizationInfo);
            } else {
                callback(undefined, authorizationInfo);
            }
        });
    }

    async getAuthorizationInfo(authorizationCode: string, codeVerifier: string): Promise<UserAuthorizationInfo> {
        let url = globalState.config.oauth.authority + globalState.config.oauth.tokenEndpoint;
        const { clientId, clientSecret } = globalState.config.oauth;
        const s = new URLSearchParams([
            ['code', authorizationCode],
            ['code_verifier', codeVerifier],
            ['grant_type', 'authorization_code'],
            ['client_id', clientId],
            ['client_secret', clientSecret],
            ['redirect_uri', this.listenUrl],
        ]);
        url = `${url}`;
        const res = await fetch(url, {
            method: 'POST',
            body: s,
            headers: [['Content-Type', 'application/x-www-form-urlencoded']],
        });
        if (res.status === 200) {
            const tokenObj = (await res.json()) as any;
            convertObjectKeysToCamelCase(tokenObj);
            return Object.assign(new UserAuthorizationInfo('', '', 0, ''), tokenObj);
        }
        throw Error(`Request access token failed, ${res.status}, ${res.statusText}, ${await res.text()}`);
    }

    resolveAuthorizationCode(callbackUrl: string): string | undefined {
        const splitted = callbackUrl.split('?');
        if (splitted.length < 2) {
            return undefined;
        }
        const s = new URLSearchParams(splitted[1]);
        const code = s.get('code');
        return code ? code : undefined;
    }

    private handleOAuthRedirect = async (
        req: express.Request,
        res: express.Response
    ): Promise<UserAuthorizationInfo | any> => {
        let error = undefined;
        let authorizationInfo: UserAuthorizationInfo | undefined = undefined;
        try {
            const code = this.resolveAuthorizationCode(req.originalUrl);
            if (!code) {
                throw Error(`Unable to resolve authorization code from callback url, ${req.originalUrl}`);
            }
            authorizationInfo = await this.getAuthorizationInfo(code, this._codeVerifier);
            res.send(
                `<p>授权成功, 您现在可以关闭此页面, 返回vscode.</p>
                <script type="text/javascript">
                var el = document.createElement('a');
                el.href='vscode://vscode.vscode-cnb';
                el.click();
                </script>`
            );
        } catch (err) {
            error = err;
            const stringifiedError = JSON.stringify(err, undefined, 4);
            res.send('发生了错误!' + (stringifiedError === '{}' ? err : stringifiedError));
        } finally {
            this._server?.close();
        }

        return error ? error : authorizationInfo;
    };
}
