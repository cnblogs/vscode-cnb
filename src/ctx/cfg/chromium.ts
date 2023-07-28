import { PlatformCfg } from '@/ctx/cfg/platform'
import getPlatformCfg = PlatformCfg.getPlatformCfg
import { ConfigurationTarget } from 'vscode'

export namespace ChromiumCfg {
    export function getChromiumPath(): string {
        return getPlatformCfg().get('chromiumPath') ?? ''
    }

    export function setChromiumPath(path: string) {
        const cfgTarget = ConfigurationTarget.Global
        return getPlatformCfg().update('chromiumPath', path, cfgTarget)
    }
}
