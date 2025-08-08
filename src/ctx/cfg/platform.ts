import os from 'os'
import { workspace } from 'vscode'

function getPlatformPrefix() {
    const osName = os.platform()

    if (osName === 'darwin') return 'macos'
    if (osName === 'win32') return 'windows'
    if (osName === 'linux') return 'linux'

    // fallback to win
    return 'windows'
}

export class PlatformCfg {
    static getPlatformCfg() {
        const entry = `cnblogsClient.${getPlatformPrefix()}`
        return workspace.getConfiguration(entry)
    }
}
