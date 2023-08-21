/// <reference lib="dom" />

import { HighlightersFactory, HljsHighlighter } from '@cnblogs/code-highlight-adapter'

HighlightersFactory.configCodeHighlightOptions({ enableCodeLineNumber: false })

function highlightLines(this: void) {
    const bgDefinitionStyleId = 'highlightedLineBackground'
    if (document.querySelector(`#${bgDefinitionStyleId}`) === null) {
        const style = document.createElement('style')
        style.id = bgDefinitionStyleId
        style.innerHTML = `:root { --highlighted-line-bg: var(--vscode-diffEditor-insertedTextBackground) }`
        document.head.append(style)
    }

    const highlighter = new HljsHighlighter()
    document.querySelectorAll<HTMLPreElement>('pre[class*="language-"][data-lines-highlight]').forEach(preEl => {
        const codeEl = preEl.querySelector('code')
        if (codeEl === null) return
        if (codeEl.firstChild instanceof HTMLDivElement && codeEl.children.length === 1)
            codeEl.firstChild.outerHTML = codeEl.firstChild.innerHTML
        highlighter.highlightLines(preEl)
    })
}

window.addEventListener('vscode.markdown.updateContent', highlightLines)
highlightLines()
