import { ImgInfo, ImgSrc } from '@/service/extract-img/get-replace-list'
import { r } from '@/infra/convert/string-literal'
import { RsMatch, RsRegex } from '@/wasm'

// Data URL reference see in:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
// Related RFC:
// https://datatracker.ietf.org/doc/html/rfc2397

const dataUrlPat = r`data:image\/.*?,[a-zA-Z0-9+/]*?=?=?`

const imgTagDataUrlImgPat = r`(<img.*?src\s*=\s*")(${dataUrlPat})"[^/]*?\/?>`
const mkdUrlImgPat = r`(!\[[^]]*\]\()([^) ]+).*?\)`
const imgTagUrlImgPat = r`(<img\s*.*?src\s*=\s*["'])(.*?)["'][^>]*?>`
const mkdDataUrlImgPat = r`(!\[.*?]\()(${dataUrlPat})\)`
const wikilinkImages = /!\[(\[.+?\])\][\s\S]+?(?<prefix>\1:\s*)(?<uri>.*?)\s+/g
const exludeDomains = /\.cnblogs\.com/i
const webUrlPrefix = /^https?:\/\//i

export const FILTER_BYTE_OFFSET = -9999

function getImagesWithTs(text: string) {
    return [...text.matchAll(wikilinkImages)].map(m => {
        const uri = m.groups?.uri ?? ''
        return <ImgInfo>{
            byteOffset: FILTER_BYTE_OFFSET,
            data: uri,
            src: webUrlPrefix.test(uri) ? ImgSrc.web : ImgSrc.fs,
            prefix: m.groups?.prefix,
        }
    })
}

export function findImgLink(text: string): ImgInfo[] {
    const imgTagUrlImgMgs = RsRegex.matches(imgTagUrlImgPat, text) as RsMatch[]
    const mkdUrlImgMgs = RsRegex.matches(mkdUrlImgPat, text) as RsMatch[]
    const urlImgInfo = imgTagUrlImgMgs.concat(mkdUrlImgMgs).map(mg => {
        const data = mg.groups[2]
        const prefix = mg.groups[1]
        const byteOffset = mg.byte_offset + Buffer.from(prefix).length

        let src
        if (webUrlPrefix.test(data)) src = ImgSrc.web
        else src = ImgSrc.fs

        return <ImgInfo>{
            byteOffset,
            data,
            src,
        }
    })

    const imgTagDataUrlImgMgs = RsRegex.matches(imgTagDataUrlImgPat, text) as RsMatch[]
    const mkdDataUrlImgMgs = RsRegex.matches(mkdDataUrlImgPat, text) as RsMatch[]
    const dataUrlImgInfo = imgTagDataUrlImgMgs.concat(mkdDataUrlImgMgs).map(mg => {
        const data = mg.groups[2]
        const prefix = mg.groups[1]
        const byteOffset = mg.byte_offset + Buffer.from(prefix).length

        return <ImgInfo>{
            byteOffset,
            data,
            src: ImgSrc.dataUrl,
        }
    })

    let images = urlImgInfo.concat(dataUrlImgInfo)
    images = images.concat(getImagesWithTs(text))
    return images.filter(x => !exludeDomains.test(x.data))
}
