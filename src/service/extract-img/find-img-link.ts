import { ImgInfo, ImgSrc } from '@/service/extract-img/get-replace-list'
import { r } from '@/infra/convert/string-literal'
import { RsMatch, RsRegex } from '@/wasm'

// Data URL reference see in:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
// Related RFC:
// https://datatracker.ietf.org/doc/html/rfc2397

const dataUrlPat = r`data:image\/.*?,[a-zA-Z0-9+/]*?=?=?`

const imgTagDataUrlImgPat = r`(<img.*?src\s*=\s*")(${dataUrlPat})"[^/]*?\/?>`
const mkdUrlImgPat = r`(!\[[^]]*\]\()([^)]+)\)`
const imgTagUrlImgPat = r`(<img\s*.*?src\s*=\s*["'])(.*?)["'][^>]*?>`
const mkdDataUrlImgPat = r`(!\[.*?]\()(${dataUrlPat})\)`
const cnbDomain = r`\.cnblogs\.com\/`

export function findImgLink(text: string): ImgInfo[] {
    const imgTagUrlImgMgs = RsRegex.matches(imgTagUrlImgPat, text) as RsMatch[]
    const mkdUrlImgMgs = RsRegex.matches(mkdUrlImgPat, text) as RsMatch[]
    const urlImgInfo = imgTagUrlImgMgs.concat(mkdUrlImgMgs).map(mg => {
        const data = mg.groups[2]
        const prefix = mg.groups[1]
        const byteOffset = mg.byte_offset + Buffer.from(prefix).length

        let src
        if (/https?:\/\//.test(data)) src = ImgSrc.web
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

    const acc = urlImgInfo.concat(dataUrlImgInfo)

    // keep links while not cnb
    return acc.filter(x => !RsRegex.isMatch(cnbDomain, x.data.toLowerCase()))
}
