import { workspace } from 'vscode'

export namespace IconThemeCfg {
    export function getIconTheme(): string {
        return workspace.getConfiguration('workbench').get('iconTheme') ?? 'unknown'
    }
}
