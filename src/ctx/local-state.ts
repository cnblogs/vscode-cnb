import { workspace } from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'

export namespace LocalState {
    export function getExtCfg() {
        return workspace.getConfiguration('cnblogsClient')
    }

    export function getState(key: string) {
        return globalCtx.extCtx.globalState.get(key)
    }

    export function setState(key: string, val: any) {
        return globalCtx.extCtx.globalState.update(key, val)
    }

    export function delState(key: string) {
        return setState(key, undefined)
    }

    export function getSecret(key: string) {
        return globalCtx.extCtx.secrets.get(key)
    }

    export function setSecret(key: string, val: string) {
        return globalCtx.extCtx.secrets.store(key, val)
    }

    export function delSecret(key: string) {
        return globalCtx.extCtx.secrets.delete(key)
    }
}
