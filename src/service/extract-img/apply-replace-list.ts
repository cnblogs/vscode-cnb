import { ImgInfo } from '@/service/extract-img/get-replace-list'
import { RsText } from '@/wasm'
import { FILTER_BYTE_OFFSET } from './find-img-link'
import { escapeRegExp } from 'lodash'

export function applyReplaceList(
    text: string,
    replaceList: [src: ImgInfo, newLink: string][],
    beforeEach: (newLink: string) => void
) {
    const rsCandidate = replaceList.filter(x => x[0].byteOffset !== FILTER_BYTE_OFFSET)

    // replace from end
    const sorted = rsCandidate.sort((a, b) => b[0].byteOffset - a[0].byteOffset)
    for (const [src, newLink] of sorted) {
        beforeEach(newLink)
        const start = src.byteOffset
        const end = src.byteOffset + Buffer.from(src.data).length
        text = RsText.replaceWithByteOffset(text, start, end, newLink)
    }

    const tsCandidate = replaceList.filter(x => x[0].byteOffset === FILTER_BYTE_OFFSET)
    for (const [src, newLink] of tsCandidate) {
        const prefix = src.prefix ?? ''
        const regex = new RegExp(escapeRegExp(String.raw`${prefix}${src.data}`), 'g')
        text = text.replace(regex, prefix + newLink)
    }

    return text
}
