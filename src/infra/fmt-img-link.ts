export function fmtImgLink(link: string, format: 'html' | 'markdown' | 'raw') {
    if (!link) return ''

    let formatted = link
    switch (format) {
        case 'html':
            formatted = `<img src="${link}" alt='image'>`
            break
        case 'markdown':
            formatted = `![img](${link})`
            break
        case 'raw':
        default:
    }

    return formatted
}
