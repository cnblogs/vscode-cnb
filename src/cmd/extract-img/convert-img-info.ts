import fs from 'fs'
import { ImgService } from '@/service/img'
import { Readable } from 'stream'
import { tmpdir } from 'os'
import { Alert } from '@/infra/alert'
import { Progress } from 'vscode'
import { join } from 'path'

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
            const stream = await resolveImgInfo(fileDir, src)
            const newLink = await ImgService.upload(stream)
            result.push([src, newLink])
        } catch (e) {
            err.push(`提取失败(${src.data}): ${<string>e}`)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    err.forEach(Alert.err)

    return result
}

function resolveDataUrlImg(dataUrl: string) {
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

    return fs.createReadStream(path)
}

function resolveFsImg(fileDir: string, path: string) {
    path = decodeURIComponent(path)
    if (fs.existsSync(path)) return fs.createReadStream(path)
    const absPath = join(fileDir, path)
    return fs.createReadStream(absPath)
}

// eslint-disable-next-line require-await
async function resolveImgInfo(fileDir: string, info: ImgInfo): Promise<Readable> {
    // for web img
    if (info.src === ImgSrc.web) return ImgService.download(info.data)

    // for fs img
    if (info.src === ImgSrc.fs) return resolveFsImg(fileDir, info.data)

    // for data url img
    if (info.src === ImgSrc.dataUrl) return resolveDataUrlImg(info.data)

    throw Error('Unreachable code')
}
