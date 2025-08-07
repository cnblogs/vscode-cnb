import { LocalState } from '@/ctx/local-state'
import { ImgSrc } from '@/service/extract-img/get-replace-list'

export class MarkdownCfg {
    static cfgGet = <T>(key: string) => LocalState.getExtCfg().get<T>(`markdown.${key}`)

    static isShowConfirmMsgWhenUploadPost(): boolean {
        return MarkdownCfg.cfgGet('showConfirmMsgWhenUploadPost') ?? true
    }

    static isIgnoreYfmWhenUploadPost(): boolean {
        return MarkdownCfg.cfgGet('ignoreYfmWhenUploadPost') ?? false
    }

    static isShowConfirmMsgWhenPullPost(): boolean {
        return MarkdownCfg.cfgGet('showConfirmMsgWhenPullPost') ?? true
    }

    static isEnableMarkdownEnhancement(): boolean {
        return MarkdownCfg.cfgGet('enableEnhancement') ?? true
    }

    static isEnableMarkdownFenceBlockquote(): boolean {
        return MarkdownCfg.cfgGet('enableFenceQuote') ?? true
    }

    static isEnableMarkdownImageSizing(): boolean {
        return MarkdownCfg.cfgGet('enableImageSizing') ?? true
    }

    static isEnableMarkdownHighlightCodeLines(): boolean {
        return MarkdownCfg.cfgGet('enableHighlightCodeLines') ?? true
    }

    static getAutoExtractImgSrc(): ImgSrc | undefined {
        type T = 'disable' | 'web' | 'dataUrl' | 'fs' | 'any'
        const cfg = MarkdownCfg.cfgGet<T>('autoExtractImages') ?? 'disable'

        if (cfg === 'disable') return
        if (cfg === 'fs') return ImgSrc.fs
        if (cfg === 'dataUrl') return ImgSrc.dataUrl
        if (cfg === 'web') return ImgSrc.web
        if (cfg === 'any') return ImgSrc.any
    }

    static getApplyAutoExtractImgToLocal(): boolean {
        return MarkdownCfg.cfgGet('applyAutoExtractImageToLocal') ?? true
    }
}
