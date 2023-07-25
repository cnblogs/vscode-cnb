import { ExtCfg } from '@/ctx/ext-cfg'
import { HighlightCodeLinesPlugin, MultilineBlockquotePlugin } from '@cnblogs/markdown-it-presets'
import type { MarkdownIt } from '@cnblogs/markdown-it-presets'

export const extendMarkdownIt = (md: MarkdownIt) =>
    md
        .use(MultilineBlockquotePlugin, {
            enable: () => ExtCfg.enableMarkdownEnhancement && ExtCfg.enableMarkdownFenceBlockquote,
        })
        .use(HighlightCodeLinesPlugin, {
            enable: () => ExtCfg.enableMarkdownEnhancement && ExtCfg.enableMarkdownHighlightCodeLines,
        })
