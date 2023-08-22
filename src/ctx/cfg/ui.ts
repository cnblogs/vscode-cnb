import { LocalState } from '@/ctx/local-state'
import getExtCfg = LocalState.getExtCfg

export namespace UiCfg {
    const cfgGet = <T>(key: string) => getExtCfg().get<T>(`ui.${key}`)

    export function isEnableTextIngStar() {
        return cfgGet<boolean>('textIngStar') ?? false
    }

    export function isDisableIngUserAvatar() {
        return cfgGet<boolean>('disableIngUserAvatar') ?? false
    }
}
