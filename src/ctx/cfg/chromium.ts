import { PlatformCfg } from '@/ctx/cfg/platform'
import { ConfigurationTarget } from 'vscode'

export class ChromiumCfg {
    static getChromiumPath(): string {
        return PlatformCfg.getPlatformCfg().get('chromiumPath') ?? ''
    }

    static setChromiumPath(path: string) {
        const cfgTarget = ConfigurationTarget.Global
        return PlatformCfg.getPlatformCfg().update('chromiumPath', path, cfgTarget)
    }
}
