import { env, ExtensionContext, Uri } from 'vscode'
import { defaultConfig, devConfig, IExtensionConfig, isDev } from '../models/config'
import path from 'path'

class GlobalContext {
    private _extensionContext?: ExtensionContext
    private readonly _config: IExtensionConfig = defaultConfig
    private readonly _devConfig: IExtensionConfig = devConfig

    get secretsStorage() {
        return this.extensionContext.secrets
    }

    get storage() {
        return this.extensionContext.globalState
    }

    get config(): IExtensionConfig {
        return isDev() ? this._devConfig : this._config
    }

    get extensionContext(): ExtensionContext {
        if (this._extensionContext == null) throw Error('extension context not exist')
        return this._extensionContext
    }

    set extensionContext(v: ExtensionContext | undefined) {
        this._extensionContext = v
    }

    get extensionName(): string {
        const { name } = <{ name?: string }>this.extensionContext.extension.packageJSON
        return name ?? 'vscode-cnb'
    }

    get publisher(): string {
        const { publisher } = <{ publisher?: string }>this.extensionContext.extension.packageJSON
        return publisher ?? 'cnblogs'
    }

    get displayName() {
        return this.extensionContext.extension.packageJSON.displayName as string
    }

    get assetsUri() {
        return Uri.file(path.join(globalContext.extensionContext.extensionPath, 'dist', 'assets'))
    }

    get extensionUrl() {
        return `${env.uriScheme}://${this.publisher}.${this.extensionName}`
    }
}

export const globalContext = new GlobalContext()
