import fs from 'fs'
import { Alert } from '@/infra/alert'
import { Progress } from 'vscode'
import { join } from 'path'
import { ImgBytes, ImgReq, RsHttp } from '@/wasm'
import { AuthManager } from '@/auth/auth-manager'
import { readableToBytes } from '@/infra/convert/readableToBuffer'
import { Blob, File, FormData } from 'formdata-node'

global.FormData = FormData
global.Blob = Blob
global.File = File

export async function getAuthedImgReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new ImgReq(token, isPatToken)
}

export type ImgInfo = {
    byteOffset: number
    data: string
    src: ImgSrc
}

export const enum ImgSrc {
    web,
    dataUrl,
    fs,
    any,
}

export async function convertImgInfo(
    fileDir: string,
    infoList: ImgInfo[],
    progress: Progress<{
        message?: string
        increment?: number
    }>
) {
    const result: [src: ImgInfo, newLink: string][] = []

    for (const src of infoList) {
        progress.report({
            message: `正在提取: ${src.data}`,
        })
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
    if (fs.existsSync(path)) {
        readable = fs.createReadStream(path)
    } else {
        const absPath = join(baseDirPath, path)
        readable = fs.createReadStream(absPath)
    }

    const bytes = await readableToBytes(readable)
    const mime = RsHttp.mimeInfer(path)
    if (mime === undefined) throw Error('未知的 MIME 类型')

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
        // eslint-disable-next-line
        return await caseFsImg(baseDirPath, path)
    }

    // for data url img
    if (info.src === ImgSrc.dataUrl) {
        const dataUrl = info.data
        return ImgBytes.fromDataUrl(dataUrl)
    }

    throw Error('Unreachable')
}
