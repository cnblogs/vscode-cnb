import fs from 'fs'
import { Alert } from '@/infra/alert'
import { join } from 'path'
import { ImgBytes, ImgReq, RsHttp, Token } from '@/wasm'
import { AuthManager } from '@/auth/auth-manager'
import { readableToBytes } from '@/infra/convert/readableToBuffer'
import { fsUtil } from '@/infra/fs/fsUtil'

export async function getAuthedImgReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new ImgReq(new Token(token, isPatToken))
}

export type ImgInfo = {
    byteOffset: number
    data: string
    src: ImgSrc
    prefix: string | undefined
}

export const enum ImgSrc {
    web,
    dataUrl,
    fs,
    any,
}

export async function getReplaceList(fileDir: string, infoList: ImgInfo[], beforeEach: (oldData: string) => void) {
    const result: [src: ImgInfo, newLink: string][] = []

    for (const src of infoList) {
        beforeEach(src.data)

        // reuse resolved link
        const resolvedLink = result.find(it => it[0].data === src.data)?.[1]
        if (resolvedLink !== undefined) {
            result.push([src, resolvedLink])
            continue
        }

        try {
            const req = await getAuthedImgReq()
            const ib = await getImgBytes(fileDir, src)
            const newLink = await req.upload(ib.bytes, ib.mime)

            result.push([src, newLink])
        } catch (e) {
            void Alert.err(`提取失败(${src.data}): ${<string>e}`)
        }
    }

    return result
}

async function caseFsImg(baseDirPath: string, path: string) {
    path = decodeURIComponent(path)

    let readable
    if (await fsUtil.exists(path)) {
        readable = fs.createReadStream(path)
    } else {
        const absPath = join(baseDirPath, path)
        if (await fsUtil.exists(absPath)) readable = fs.createReadStream(absPath)
        else throw Error('文件不存在')
    }

    const bytes = await readableToBytes(readable)
    let mime = RsHttp.mimeInfer(path)
    if (mime === undefined) mime = 'image/png'

    return new ImgBytes(bytes, mime)
}

async function getImgBytes(baseDirPath: string, info: ImgInfo) {
    // for web img
    if (info.src === ImgSrc.web) {
        const url = info.data
        return ImgReq.download(url)
    }

    // for fs img
    if (info.src === ImgSrc.fs) {
        const path = info.data
        return await caseFsImg(baseDirPath, path)
    }

    // for data url img
    if (info.src === ImgSrc.dataUrl) {
        const dataUrl = info.data
        return ImgBytes.fromDataUrl(dataUrl)
    }

    throw Error('Unreachable')
}
