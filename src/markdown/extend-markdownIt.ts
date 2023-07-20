import { Settings } from '@/services/settings.service'
import { HighlightCodeLinesPlugin, MultilineBlockquotePlugin } from '@cnblogs/markdown-it-presets'
import type { MarkdownIt } from '@cnblogs/markdown-it-presets'

export const extendMarkdownIt = (md: MarkdownIt) =>
    md
        .use(MultilineBlockquotePlugin, {
            enable: () => Settings.isEnableMarkdownEnhancement && Settings.isEnableMarkdownFenceBlockquote,
        })
        .use(HighlightCodeLinesPlugin, {
            enable: () => Settings.isEnableMarkdownEnhancement && Settings.isEnableMarkdownHighlightCodeLines,
        })
