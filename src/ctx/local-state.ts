import { workspace } from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'

export class LocalState {
    static getExtCfg() {
        return workspace.getConfiguration('cnblogsClient')
    }

    static getState(key: string) {
        return globalCtx.extCtx.globalState.get(key)
    }

    static setState(key: string, val: any) {
        return globalCtx.extCtx.globalState.update(key, val)
    }

    static delState(key: string) {
        return LocalState.setState(key, undefined)
    }

    static getSecret(key: string) {
        return globalCtx.extCtx.secrets.get(key)
    }

    static setSecret(key: string, val: string) {
        return globalCtx.extCtx.secrets.store(key, val)
    }

    static delSecret(key: string) {
        return globalCtx.extCtx.secrets.delete(key)
    }
}
