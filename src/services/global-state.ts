import { ExtensionContext, Uri } from 'vscode';
import { defaultConfig, devConfig, IConfig, isDev } from '../models/config';
import path from 'path';

export class GlobalState {
    private static _instance = new GlobalState();

    private _extensionContext?: ExtensionContext;
    private _config: IConfig = defaultConfig;
    private _devConfig: IConfig = devConfig;

    protected constructor() {}

    static get instance() {
        return this._instance;
    }

    get secretsStorage() {
        return this.extensionContext.secrets;
    }

    get storage() {
        return this.extensionContext.globalState;
    }

    get config(): IConfig {
        return isDev() ? this._devConfig : this._config;
    }

    get extensionContext(): ExtensionContext {
        if (this._extensionContext == null) throw Error('extension context not exist');
        return this._extensionContext;
    }

    set extensionContext(v: ExtensionContext | undefined) {
        this._extensionContext = v;
    }

    get extensionName(): string {
        const { name } = <{ name?: string }>this.extensionContext.extension.packageJSON;
        return name ?? '';
    }

    get assetsUri() {
        return Uri.file(path.join(globalState.extensionContext.extensionPath, 'dist', 'assets'));
    }
}

export const globalState = GlobalState.instance;
