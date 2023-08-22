export function fmtImgLink(link: string, format: 'html' | 'markdown' | 'raw') {
    if (link === '') return ''

    if (format === 'html') return `<img src="${link}" alt="image">`
    if (format === 'markdown') return `![img](${link})`

    // raw case
    return link
}
