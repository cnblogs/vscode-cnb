import { readableToBytes } from '@/infra/convert/readableToBuffer'
import fs from 'fs'
import { getAuthedImgReq } from '@/cmd/extract-img/convert-img-info'
import { RsHttp } from '@/wasm'

export async function uploadImgFromPath(path: string) {
    const readable = fs.createReadStream(path)

    const bytes = await readableToBytes(readable)
    const req = await getAuthedImgReq()
    const mime = RsHttp.mimeInfer(path)
    if (mime === undefined) throw Error('未知的 MIME 类型')

    return req.upload(bytes, mime)
}
