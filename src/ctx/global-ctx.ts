import { env, ExtensionContext, Uri } from 'vscode'
import path from 'path'
import { execCmd } from '@/infra/cmd'
import { ExtConst } from '@/ctx/ext-const'

export class GlobalCtx {
    private _extensionContext: ExtensionContext | null = null

    get extCtx(): ExtensionContext {
        if (this._extensionContext == null) throw Error('ext ctx not exist')
        return this._extensionContext
    }

    set extCtx(v: ExtensionContext) {
        this._extensionContext = v
    }

    get assetsUri() {
        const joined = path.join(globalCtx.extCtx.extensionPath, 'dist', 'assets')
        return Uri.file(joined)
    }

    get extUrl() {
        return `${env.uriScheme}://${ExtConst.EXT_PUBLISHER}.${ExtConst.EXT_NAME}`
    }
}

export async function setCtx(key: string, val: any) {
    await execCmd('setContext', `${ExtConst.EXT_NAME}.${key}`, val)
}

export const globalCtx = new GlobalCtx()
