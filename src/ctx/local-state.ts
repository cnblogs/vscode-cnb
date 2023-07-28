import { workspace } from 'vscode'

export namespace LocalState {
    export function getExtCfg() {
        return workspace.getConfiguration('cnblogsClient')
    }
}
