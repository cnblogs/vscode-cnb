import { ExtensionContext } from 'vscode';
import { defaultConfig, devConfig, IConfig, isDev } from '../models/config';

export class GlobalState {
    private static _instance = new GlobalState();

    private _extensionContext?: ExtensionContext;
    private _config: IConfig = defaultConfig;
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

    get extensionContext(): ExtensionContext | undefined {
        return this._extensionContext;
    }
    set extensionContext(v: ExtensionContext | undefined) {
        this._extensionContext = v;
    }

    get extensionName(): string {
        return this.extensionContext?.extension.packageJSON['name'] ?? '';
    }

    protected constructor() {}
}

export const globalManager = GlobalState.instance;
