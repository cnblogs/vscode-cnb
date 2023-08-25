import fs from 'fs'
import { tmpdir } from 'os'
import { Alert } from '@/infra/alert'
import { Progress } from 'vscode'
import { join } from 'path'
import { ImgReq, RsHttp } from '@/wasm'
import { AuthManager } from '@/auth/auth-manager'
import { readableToBytes } from '@/infra/convert/readableToBuffer'
import { Blob, File, FormData } from 'formdata-node'
import { ImgDlResult } from '@/wasm'

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
    const err = []

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
            const dlr = await getImgDlResult(fileDir, src)
            console.log(dlr.bytes)
            console.log(dlr.mime)
            const newLink = await req.upload(dlr.bytes, dlr.mime)

            result.push([src, newLink])
        } catch (e) {
            console.log(e)
            err.push(`提取失败(${src.data}): ${<string>e}`)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    err.forEach(Alert.err)

    return result
}

async function caseDataUrlImg(dataUrl: string) {
    // reference for this impl:
    // https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript/7261048#7261048

    const regex = /data:image\/(.*?);.*?,([a-zA-Z0-9+/]*=?=?)/g

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mg = Array.from(dataUrl.matchAll(regex))
    const buf = Buffer.from(mg[0][2], 'base64')

    const ext = mg[0][1]
    const fileName = `${Date.now()}.${ext}`
    const path = `${tmpdir()}/` + fileName
    fs.writeFileSync(path, buf, 'utf8')

    const readable = fs.createReadStream(path)

    const bytes = await readableToBytes(readable)
    const mime = RsHttp.mimeInfer(path)
    if (mime === undefined) throw Error('未知的 MIME 类型')

    return new ImgDlResult(bytes, mime)
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

    return new ImgDlResult(bytes, mime)
}

// eslint-disable-next-line require-await
async function getImgDlResult(baseDirPath: string, info: ImgInfo) {
    // for web img
    if (info.src === ImgSrc.web) {
        const url = info.data
        return ImgReq.download(url)
    }

    // for fs img
    if (info.src === ImgSrc.fs) {
        const path = info.data
        return caseFsImg(baseDirPath, path)
    }

    // for data url img
    if (info.src === ImgSrc.dataUrl) {
        const dataUrl = info.data
        return caseDataUrlImg(dataUrl)
    }

    throw Error('Unreachable')
}
