import { LocalState } from '@/ctx/local-state'

export class UiCfg {
    static cfgGet = <T>(key: string) => LocalState.getExtCfg().get<T>(`ui.${key}`)

    static isEnableTextIngStar() {
        return UiCfg.cfgGet<boolean>('textIngStar') ?? false
    }

    static isDisableIngUserAvatar() {
        return UiCfg.cfgGet<boolean>('disableIngUserAvatar') ?? false
    }
}
