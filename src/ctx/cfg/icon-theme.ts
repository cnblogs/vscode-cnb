import { workspace } from 'vscode'

export class IconThemeCfg {
    static getIconTheme(): string {
        return workspace.getConfiguration('workbench').get('iconTheme') ?? 'unknown'
    }
}
