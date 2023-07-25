import { Settings } from '@/service/settings'
import { HighlightCodeLinesPlugin, MultilineBlockquotePlugin } from '@cnblogs/markdown-it-presets'
import type { MarkdownIt } from '@cnblogs/markdown-it-presets'

export const extendMarkdownIt = (md: MarkdownIt) =>
    md
        .use(MultilineBlockquotePlugin, {
            enable: () => Settings.enableMarkdownEnhancement && Settings.enableMarkdownFenceBlockquote,
        })
        .use(HighlightCodeLinesPlugin, {
            enable: () => Settings.enableMarkdownEnhancement && Settings.enableMarkdownHighlightCodeLines,
        })
