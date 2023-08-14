import { env, ExtensionContext, Uri } from 'vscode'
import path from 'path'

export class GlobalCtx {
    private _extensionContext: ExtensionContext | null = null

    get extCtx(): ExtensionContext {
        if (this._extensionContext == null) throw Error('ext ctx not exist')
        return this._extensionContext
    }

    set extCtx(v: ExtensionContext) {
        this._extensionContext = v
    }

    get extName(): string {
        const name = <string | undefined>this.extCtx.extension.packageJSON.name
        if (name === undefined) throw Error('ext name not exist')
        return name
    }

    get publisher(): string {
        const publisher = <string | undefined>this.extCtx.extension.packageJSON.publisher
        if (publisher === undefined) throw Error('ext publisher not exist')
        return publisher
    }

    get displayName() {
        const displayName = <string | undefined>this.extCtx.extension.packageJSON.displayName
        if (displayName === undefined) throw Error('ext displayName not exist')
        return displayName
    }

    get assetsUri() {
        const joined = path.join(globalCtx.extCtx.extensionPath, 'dist', 'assets')
        return Uri.file(joined)
    }

    get extUrl() {
        return `${env.uriScheme}://${this.publisher}.${this.extName}`
    }
}

export const globalCtx = new GlobalCtx()
