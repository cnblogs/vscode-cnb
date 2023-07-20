import { Settings } from '@/services/settings.service'
import type { MarkdownIt } from '@cnblogs/markdown-it-presets'
import { HighlightCodeLinesPlugin, MultilineBlockquotePlugin } from '@cnblogs/markdown-it-presets'

export const extendMarkdownIt = (md: MarkdownIt) =>
    md
        .use(MultilineBlockquotePlugin, {
            enable: () => Settings.isEnableMarkdownEnhancement && Settings.isEnableMarkdownFenceBlockquote,
        })
        .use(HighlightCodeLinesPlugin, {
            enable: () => Settings.isEnableMarkdownEnhancement && Settings.isEnableMarkdownHighlightCodeLines,
        })
