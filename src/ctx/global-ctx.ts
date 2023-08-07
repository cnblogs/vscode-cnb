import { env, ExtensionContext, Uri } from 'vscode'
import { defaultConfig, devConfig, ExtConst, isDevEnv } from '@/model/config'
import path from 'path'

export class GlobalCtx {
    private _extensionContext: ExtensionContext | null = null
    private readonly _config: ExtConst = defaultConfig
    private readonly _devConfig: ExtConst = devConfig

    get secretsStorage() {
        return this.extCtx.secrets
    }

    get storage() {
        return this.extCtx.globalState
    }

    get config(): ExtConst {
        return isDevEnv() ? this._devConfig : this._config
    }

    get extCtx(): ExtensionContext {
        if (this._extensionContext == null) throw Error('extension context not exist')
        return this._extensionContext
    }

    set extCtx(v: ExtensionContext) {
        this._extensionContext = v
    }

    get extName(): string {
        const { name } = <{ name?: string }>this.extCtx.extension.packageJSON
        return name ?? 'vscode-cnb'
    }

    get publisher(): string {
        const { publisher } = <{ publisher?: string }>this.extCtx.extension.packageJSON
        return publisher ?? 'cnblogs'
    }

    get displayName() {
        return this.extCtx.extension.packageJSON.displayName as string
    }

    get assetsUri() {
        return Uri.file(path.join(globalCtx.extCtx.extensionPath, 'dist', 'assets'))
    }

    get extensionUrl() {
        return `${env.uriScheme}://${this.publisher}.${this.extName}`
    }
}

export const globalCtx = new GlobalCtx()
