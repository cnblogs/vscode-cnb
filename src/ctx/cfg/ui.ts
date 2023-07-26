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

/*
// TODO: need solution
"cnblogsClient.ui.textIngEmoji": {
    "order": 17,
    "type": "boolean",
    "scope": "application",
    "default": false,
    "markdownDescription": "闪存 Emoji 文本化"
},
export function isEnableTextIngEmoji() {
    return cfgGet<boolean>('textIngEmoji') ?? false
}
*/

/*
// TODO: waiting for VSC API support
"cnblogsClient.ui.fakeExtIcon": {
    "order": 18,
    "type": "boolean",
    "scope": "application",
    "default": false,
    "markdownDescription": "伪装扩展图标"
}
export function applyFakeExtIcon(cfg: WorkspaceCfg) {
    const isEnable = cfg.get<boolean>('ui.fakeExtIcon')
    console.log(isEnable)
}
*/
