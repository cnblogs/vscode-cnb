import { Settings } from '@/services/settings.service';
import { HighlightCodeLinesPlugin, MarkdownIt, MultilineBlockquotePlugin } from '@cnblogs/markdown-it-presets';

export const extendMarkdownIt = (md: MarkdownIt) =>
    md
        .use(MultilineBlockquotePlugin, {
            enable: () => Settings.isEnableMarkdownEnhancement && Settings.isEnableMarkdownFenceBlockquote,
        })
        .use(HighlightCodeLinesPlugin, {
            enable: () => Settings.isEnableMarkdownEnhancement && Settings.isEnableMarkdownHighlightCodeLines,
        });
