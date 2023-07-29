import { DataType, ImgInfo } from '@/markdown/mkd-img-extractor'
import { r } from '@/infra/convert/string-literal'
import { RsMatch, RsRegex } from '@/wasm'

// Data URL reference see in:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
// Related RFC:
// https://datatracker.ietf.org/doc/html/rfc2397

const imgExtPat = r`png|jpg|jpeg|webp|svg|gif`
const imgUrlPat = r`.*?\.(?:${imgExtPat})`
const dataUrlPat = r`data:image\/.*?,[a-zA-Z0-9+/]*?=?=?`

const imgTagDataUrlImgPat = r`(<img.*?src\s*=\s*")(${dataUrlPat})("[^/]*?\/?>)`
const mkdUrlImgPat = r`(!\[.*?]\()(${imgUrlPat})(\))`
const imgTagUrlImgPat = r`(<img.*?src\s*=\s*")(${imgUrlPat})("[^/]*?\/?>)`
const mkdDataUrlImgPat = r`(!\[.*?]\()(${dataUrlPat})(\))`
const cnbDomain = r`\.cnblogs\.com\/`

export function findImgLink(text: string): ImgInfo[] {
    const imgTagUrlImgMgs = RsRegex.matches(imgTagUrlImgPat, text) as RsMatch[]
    const mkdUrlImgMgs = RsRegex.matches(mkdUrlImgPat, text) as RsMatch[]
    const urlImgInfo = imgTagUrlImgMgs.concat(mkdUrlImgMgs).map<ImgInfo>(mg => ({
        offset: mg.offset,
        dataType: DataType.url,
        data: mg.groups[2],
        prefix: mg.groups[1],
        postfix: mg.groups[3],
    }))

    const imgTagDataUrlImgMgs = RsRegex.matches(imgTagDataUrlImgPat, text) as RsMatch[]
    const mkdDataUrlImgMgs = RsRegex.matches(mkdDataUrlImgPat, text) as RsMatch[]
    const dataUrlImgInfo = imgTagDataUrlImgMgs.concat(mkdDataUrlImgMgs).map<ImgInfo>(mg => ({
        offset: mg.offset,
        dataType: DataType.dataUrl,
        data: mg.groups[2],
        prefix: mg.groups[1],
        postfix: mg.groups[3],
    }))

    const acc = urlImgInfo.concat(dataUrlImgInfo)

    // keep links while not cnb
    return acc.filter(x => !RsRegex.isMatch(cnbDomain, x.data.toLowerCase()))
}
