export const formatImageLink = (link: string, format: 'html' | 'markdown' | 'raw'): string => {
    if (!link) return '';

    let formatted = link;
    switch (format) {
        case 'html':
            formatted = `<img src="${link}">`;
            break;
        case 'markdown':
            formatted = `![img](${link})`;
            break;
        case 'raw':
        default:
    }

    return formatted;
};
