import { convertObjectKeysToCamelCase } from './fetch-json-response-to-camel-case';
import { UserAuthorizationInfo, UserInfo } from './../models/user-settings';
import { globalState } from './global-state';
import { CnblogsOAuthService } from './cnblogs-oauth.service';
import vscode from 'vscode';
import { URLSearchParams } from 'url';
import { generateCodeChallenge } from './code-challenge.service';
import RandomString from 'randomstring';
import fetch from 'node-fetch';
import { accountViewDataProvider } from '../tree-view-providers/account-view-data-provider';
import { postsDataProvider } from '../tree-view-providers/posts-data-provider';
import { postCategoriesDataProvider } from '../tree-view-providers/categories-view-data-provider';
import { checkIsAccessTokenExpired } from '../utils/check-access-token-expired';

const isAuthorizedStorageKey = 'isAuthorized';

export class AccountService extends vscode.Disposable {
    private static _instance: AccountService = new AccountService();

    buildBearerAuthorizationHeader(accessToken?: string): [string, string] {
        accessToken ??= this.curUser.authorizationInfo?.accessToken;
        let expired = checkIsAccessTokenExpired(accessToken!);
        if (expired) {
            void Promise.all([this.logout(), this.alertLoginStatusExpired()]);
        }
        return ['Authorization', `Bearer ${expired ? '' : accessToken}`];
    }

    private _curUser?: UserInfo;
    private _oauthServ = new CnblogsOAuthService();

    static get instance() {
        return this._instance;
    }

    get isAuthorized() {
        return globalState.storage.get(isAuthorizedStorageKey);
    }

    get curUser(): UserInfo {
        return (
            this._curUser ||
            (this._curUser = Object.assign(new UserInfo(), globalState.storage.get('user') ?? new UserInfo()))
        );
    }

    protected constructor() {
        super(() => this._oauthServ.dispose());
    }

    async login() {
        const { codeVerifier, codeChallenge } = generateCodeChallenge();
        this._oauthServ.startListenAuthorizationCodeCallback(codeVerifier, (authorizationInfo, err) => {
            if (authorizationInfo && !err) {
                return this.handleAuthorized(authorizationInfo);
            }
        });
        const { clientId, responseType, scope, authorizeEndpoint, authority, clientSecret } = globalState.config.oauth;
        let url = `${authority}${authorizeEndpoint}`;
        const search = new URLSearchParams([
            ['client_id', clientId],
            ['response_type', responseType],
            ['redirect_uri', this._oauthServ.listenUrl],
            ['nonce', RandomString.generate(32)],
            ['code_challenge', codeChallenge],
            ['code_challenge_method', 'S256'],
            ['scope', scope],
            ['client_secret', clientSecret],
        ]);
        url = `${url}?${search}`;
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
        accountViewDataProvider.fireTreeDataChangedEvent();
        postsDataProvider.fireTreeDataChangedEvent(undefined);
        postCategoriesDataProvider.fireTreeDataChangedEvent();
    }

    async logout() {
        if (!this.isAuthorized) {
            return;
        }

        const { clientId, revocationEndpoint, authority } = globalState.config.oauth;
        const token = this.curUser?.authorizationInfo?.accessToken;

        await globalState.storage.update('user', {});
        this._curUser = undefined;
        await this.setIsAuthorized(false);

        if (token) {
            const body = new URLSearchParams([
                ['client_id', clientId],
                ['token', token],
                ['token_type_hint', 'access_token'],
            ]);
            let url = `${authority}${revocationEndpoint}`;
            const res = await fetch(url, {
                method: 'POST',
                body: body,
                headers: [
                    this.buildBearerAuthorizationHeader(token),
                    ['Content-Type', 'application/x-www-form-urlencoded'],
                ],
            });
            if (!res.ok) {
                console.warn('Revocation failed', res);
            }
        }
    }

    async refreshUserInfo() {
        if (this.curUser && this.curUser.authorizationInfo) {
            await this.fetchAndStoreUserInfo(this.curUser.authorizationInfo);
        }
    }

    async setIsAuthorizedToContext() {
        await vscode.commands.executeCommand(
            'setContext',
            `${globalState.extensionName}.${isAuthorizedStorageKey}`,
            this.isAuthorized
        );
        if (this.isAuthorized) {
            await vscode.commands.executeCommand('setContext', `${globalState.extensionName}.user`, {
                name: this.curUser.name,
                avatar: this.curUser.avatar,
            });
        }
    }

    private async setIsAuthorized(authorized = false): Promise<void> {
        await globalState.storage.update(isAuthorizedStorageKey, authorized);
        await this.setIsAuthorizedToContext();
    }

    private async handleAuthorized(authorizationInfo: UserAuthorizationInfo) {
        await this.fetchAndStoreUserInfo(authorizationInfo);
        await this.setIsAuthorized(true);
    }

    private async fetchAndStoreUserInfo(authorizationInfo: UserAuthorizationInfo) {
        const userInfo = await this.fetchUserInfo(authorizationInfo);
        await globalState.storage.update('user', userInfo);
        return userInfo;
    }

    private async fetchUserInfo(authorizationInfo: UserAuthorizationInfo): Promise<UserInfo> {
        const { authority, userInfoEndpoint } = globalState.config.oauth;
        const res = await fetch(`${authority}${userInfoEndpoint}`, {
            method: 'GET',
            headers: [this.buildBearerAuthorizationHeader(authorizationInfo.accessToken)],
        });
        const obj = convertObjectKeysToCamelCase((await res.json()) as any);
        obj.avatar = obj.picture;
        delete obj.picture;
        return Object.assign(new UserInfo(authorizationInfo), obj, { avatar: obj.picture });
    }

    private async alertLoginStatusExpired() {
        const options = ['登录'];
        const input = await vscode.window.showInformationMessage(
            '登录状态已过期, 请重新登录',
            { modal: true } as vscode.MessageOptions,
            ...options
        );
        if (input === options[0]) {
            await this.login();
        }
    }
}

export const accountService = AccountService.instance;
