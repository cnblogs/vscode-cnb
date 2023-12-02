import { HighlightCodeLinesPlugin, MultilineBlockquotePlugin, ImageSizePlugin } from '@cnblogs/markdown-it-presets'
import type { MarkdownIt } from '@cnblogs/markdown-it-presets'
import { MarkdownCfg } from '@/ctx/cfg/markdown'

export const extendMarkdownIt = (md: MarkdownIt) =>
    md
        .use(MultilineBlockquotePlugin, {
            enable: () => MarkdownCfg.isEnableMarkdownEnhancement() && MarkdownCfg.isEnableMarkdownFenceBlockquote(),
        })
        .use(ImageSizePlugin, {
            enable: () => MarkdownCfg.isEnableMarkdownEnhancement() && MarkdownCfg.isEnableMarkdownImageSizing(),
        })
        .use(HighlightCodeLinesPlugin, {
            enable: () => MarkdownCfg.isEnableMarkdownEnhancement() && MarkdownCfg.isEnableMarkdownHighlightCodeLines(),
        })
