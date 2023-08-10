import path from 'path'
import { isString } from 'lodash-es'
import fs from 'fs'
import { Uri, workspace } from 'vscode'
import { ImgService } from '@/service/img'
import { isErrorResponse } from '@/model/error-response'
import { promisify } from 'util'
import { Readable } from 'stream'
import { tmpdir } from 'os'

export type ImgInfo = {
    offset: number
    data: string
    src: ImgSrc
}

export const enum ImgSrc {
    web,
    dataUrl,
    fs,
    any,
}

enum ExtractorSt {
    pending,
    extracting,
    extracted,
}

export class MkdImgExtractor {
    private _status = ExtractorSt.pending
    private _errors: [imgLink: string, msg: string][] = []
    private readonly _workspaceDirs: string[] = []

    constructor(
        private readonly targetFileUri: Uri,
        public onProgress?: (index: number, images: ImgInfo[]) => void
    ) {
        if (workspace.workspaceFolders !== undefined)
            this._workspaceDirs = workspace.workspaceFolders.map(({ uri: { fsPath } }) => fsPath)
    }

    get status() {
        return this._status
    }

    get errors() {
        return this._errors
    }

    async extract(imgInfoList: ImgInfo[]): Promise<[src: ImgInfo, dst: ImgInfo | null][]> {
        this._status = ExtractorSt.extracting

        let count = 0

        const result: ReturnType<MkdImgExtractor['extract']> extends Promise<infer U> ? U : never = []

        for (const srcInfo of imgInfoList) {
            if (this.onProgress) this.onProgress(count++, imgInfoList)

            // reuse resolved link
            const resolvedLink = result.find(([src, dst]) => dst != null && src.data === srcInfo.data)?.[1]?.data

            const streamOrLink = resolvedLink ?? (await this.resolveImgInfo(srcInfo))

            const dstInfo = await (async () => {
                if (streamOrLink === undefined) return null
                try {
                    const newLink = isString(streamOrLink) ? streamOrLink : await ImgService.upload(streamOrLink)

                    return {
                        ...srcInfo,
                        data: newLink,
                    }
                } catch (e) {
                    const errMsg = `上传图片失败, ${isErrorResponse(e) ? e.errors.join(',') : JSON.stringify(e)}`
                    this._errors.push([srcInfo.data, errMsg])
                    return null
                }
            })()

            result.push([srcInfo, dstInfo])
        }

        this._status = ExtractorSt.extracted

        return result
    }

    private async resolveWebImg(url: string) {
        try {
            return await ImgService.download(url)
        } catch (e) {
            this._errors.push([url, `无法下载网络图片: ${<string>e}`])
            return
        }
    }

    private async resolveFsImg(imgPath: string) {
        const checkReadAccess = (filePath: string) =>
            promisify(fs.access)(filePath).then(
                () => true,
                () => false
            )

        let iPath: string | undefined | null = imgPath
        let iDir = 0
        let searchingDirs: string[] | undefined | null
        let isEncodedPath = false

        while (iPath != null) {
            if (await checkReadAccess(iPath)) return fs.createReadStream(iPath)

            if (!isEncodedPath) {
                iPath = decodeURIComponent(iPath)
                isEncodedPath = true
                continue
            }

            searchingDirs ??= [path.dirname(this.targetFileUri.fsPath), ...this._workspaceDirs]
            iPath = iDir >= 0 && searchingDirs.length > iDir ? path.resolve(searchingDirs[iDir], imgPath) : undefined
            iDir++
            isEncodedPath = false
        }
    }

    private resolveDataUrlImg(dataUrl: string) {
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

    private async resolveImgInfo(info: ImgInfo): Promise<Readable | undefined> {
        // for web img
        // eslint-disable-next-line no-return-await
        if (info.src === ImgSrc.web) return await this.resolveWebImg(info.data)

        // for fs img
        // eslint-disable-next-line no-return-await
        if (info.src === ImgSrc.fs) return await this.resolveFsImg(info.data)

        // for data url img
        if (info.src === ImgSrc.dataUrl) return this.resolveDataUrlImg(info.data)
    }
}
