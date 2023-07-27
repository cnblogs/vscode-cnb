// Data URL reference see in:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
// Related RFC:
// https://datatracker.ietf.org/doc/html/rfc2397

import { DataType, ImgInfo } from '@/markdown/mkd-img-extractor'
import { notRegMatch } from '@/wasm'

const imgTagDataUrlImgPat = /(<img.*?src\s*=\s*")(data:image\/.*?,[a-zA-Z0-9+/]*?=?=?)("[^/]*?\/?>)/g
const imgTagUrlImgPat = /(<img.*?src\s*=\s*")(.*\.(?:png|jpg|jpeg|webp|svg|gif))("[^/]*?\/?>)/gi
const mkdDataUrlImgPat = /(!\[.*?]\()(data:image\/.*?,[a-zA-Z0-9+/]*?=?=?)(\))/g
const mkdUrlImgPat = /(!\[.*?]\()(.*?\.(?:png|jpg|jpeg|webp|svg|gif))(\))/gi
const cnblogsDomain = `\.cnblogs\.com\/`

export function findImgLink(text: string): ImgInfo[] {
    const imgTagUrlImgMatchGroups = Array.from(text.matchAll(imgTagUrlImgPat))
    const mkdUrlImgMatchGroups = Array.from(text.matchAll(mkdUrlImgPat))
    const urlImgInfo = imgTagUrlImgMatchGroups.concat(mkdUrlImgMatchGroups).map<ImgInfo>(mg => ({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        startOffset: mg.index!,
        dataType: DataType.url,
        data: mg[2],
        prefix: mg[1],
        postfix: mg[3],
    }))

    const imgTagDataUrlImgMatchGroups = Array.from(text.matchAll(imgTagDataUrlImgPat))
    const mkdDataUrlImgMatchGroups = Array.from(text.matchAll(mkdDataUrlImgPat))
    const dataUrlImgInfo = imgTagDataUrlImgMatchGroups.concat(mkdDataUrlImgMatchGroups).map<ImgInfo>(mg => ({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        startOffset: mg.index!,
        dataType: DataType.dataUrl,
        data: mg[2],
        prefix: mg[1],
        postfix: mg[3],
    }))

    const acc = urlImgInfo.concat(dataUrlImgInfo)

    // TODO: better filter design needed
    // remove cnblogs img link
    return acc.filter(x => notRegMatch(cnblogsDomain, x.data))
}
