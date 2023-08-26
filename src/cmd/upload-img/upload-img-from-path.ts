import { readableToBytes } from '@/infra/convert/readableToBuffer'
import fs from 'fs'
import { RsHttp } from '@/wasm'
import { getAuthedImgReq } from '@/service/extract-img/get-replace-list'

export async function uploadImgFromPath(path: string) {
    const readable = fs.createReadStream(path)

    const bytes = await readableToBytes(readable)
    const req = await getAuthedImgReq()
    const mime = RsHttp.mimeInfer(path)
    if (mime === undefined) throw Error('未知的 MIME 类型')

    return req.upload(bytes, mime)
}
