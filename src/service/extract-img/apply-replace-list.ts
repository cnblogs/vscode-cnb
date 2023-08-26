import { ImgInfo } from '@/service/extract-img/get-replace-list'
import { RsText } from '@/wasm'

export function applyReplaceList(
    text: string,
    replaceList: [src: ImgInfo, newLink: string][],
    beforeEach: (newLink: string) => void
) {
    // replace from end
    const sorted = replaceList.sort((a, b) => b[0].byteOffset - a[0].byteOffset)
    for (const [src, newLink] of sorted) {
        beforeEach(newLink)
        const start = src.byteOffset
        const end = src.byteOffset + Buffer.from(src.data).length
        text = RsText.replaceWithByteOffset(text, start, end, newLink)
    }
    return text
}
