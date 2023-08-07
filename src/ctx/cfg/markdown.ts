import { LocalState } from '@/ctx/local-state'
import getExtCfg = LocalState.getExtCfg
import { ImgSrc } from '@/markdown/mkd-img-extractor'

export namespace MarkdownCfg {
    const cfgGet = <T>(key: string) => getExtCfg().get<T>(`markdown.${key}`)

    export function isShowConfirmMsgWhenUploadPost(): boolean {
        return cfgGet('showConfirmMsgWhenUploadPost') ?? true
    }

    export function isIgnoreYfmWhenUploadPost(): boolean {
        return cfgGet('ignoreYfmWhenUploadPost') ?? false
    }

    export function isShowConfirmMsgWhenPullPost(): boolean {
        return cfgGet('showConfirmMsgWhenPullPost') ?? true
    }

    export function isEnableMarkdownEnhancement(): boolean {
        return cfgGet('enableEnhancement') ?? true
    }

    export function isEnableMarkdownFenceBlockquote(): boolean {
        return cfgGet('enableFenceQuote') ?? true
    }

    export function isEnableMarkdownHighlightCodeLines(): boolean {
        return cfgGet('enableHighlightCodeLines') ?? true
    }

    export function getAutoExtractImgSrc(): ImgSrc | undefined {
        type T = 'disable' | 'web' | 'dataUrl' | 'fs' | 'any'
        const cfg = cfgGet<T>('autoExtractImages') ?? 'disable'

        if (cfg === 'disable') return
        if (cfg === 'fs') return ImgSrc.fs
        if (cfg === 'dataUrl') return ImgSrc.dataUrl
        if (cfg === 'web') return ImgSrc.web
        if (cfg === 'any') return ImgSrc.any
    }
}
