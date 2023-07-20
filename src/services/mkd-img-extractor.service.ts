import { isErrorResponse } from '@/models/error-response'
import fs from 'fs'
import { isString } from 'lodash-es'
import { tmpdir } from 'os'
import path from 'path'
import { Readable } from 'stream'
import { promisify } from 'util'
import { Uri, workspace } from 'vscode'
import { ImageService } from './image.service'

export const enum DataType {
    dataUrl,
    url,
}

export interface ImageInfo {
    startOffset: number
    data: string
    dataType: DataType
    prefix: string
    postfix: string
}

// Data URL reference see in:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
// Related RFC:
// https://datatracker.ietf.org/doc/html/rfc2397

const imgTagDataUrlImgPat = /(<img.*?src\s*=\s*")(data:image\/.*?,[a-zA-Z0-9+/]*?=?=?)("[^/]*?\/?>)/g
const imgTagUrlImgPat = /(<img.*?src\s*=\s*")(.*\.(?:png|jpg|jpeg|webp|svg|gif))("[^/]*?\/?>)/gi
const mkdDataUrlImgPat = /(!\[.*?\]\()(data:image\/.*?,[a-zA-Z0-9+/]*?=?=?)(\))/g
const mkdUrlImgPat = /(!\[.*?\]\()(.*?\.(?:png|jpg|jpeg|webp|svg|gif))(\))/gi

const cnblogsDomainRegExp = /\.cnblogs\.com\//gi

export const enum ImageSrc {
    web,
    dataUrl,
    fs,
    any,
}

export const newImageSrcFilter = (type: ImageSrc) => {
    const isWebImage = (imgInfo: ImageInfo) => imgInfo.dataType === DataType.url && /https?:\/\//.test(imgInfo.data)
    const isFsImage = (imgInfo: ImageInfo) => imgInfo.dataType === DataType.url && !isWebImage(imgInfo)
    const isDataUrlImage = (imgInfo: ImageInfo) => imgInfo.dataType === DataType.dataUrl
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isAnyImage = (_: ImageInfo) => true

    switch (type) {
        case ImageSrc.web:
            return isWebImage
        case ImageSrc.fs:
            return isFsImage
        case ImageSrc.dataUrl:
            return isDataUrlImage
        case ImageSrc.any:
            return isAnyImage
    }
}

enum ExtractorSt {
    pending,
    extracting,
    extracted,
}

export class MkdImgExtractor {
    private _imageSrc = ImageSrc.any
    private _status = ExtractorSt.pending
    private _errors: [imageLink: string, msg: string][] = []
    private _images: ImageInfo[] | null | undefined = null
    private readonly _workspaceDirs: string[] | undefined

    constructor(
        private readonly markdown: string,
        private readonly targetFileUri: Uri,
        public onProgress?: (index: number, images: ImageInfo[]) => void
    ) {
        this._workspaceDirs = workspace.workspaceFolders?.map(({ uri: { fsPath } }) => fsPath)
    }

    get imageSrc() {
        return this._imageSrc
    }

    set imageSrc(v) {
        this._imageSrc = v
    }

    get status() {
        return this._status
    }

    get errors() {
        return this._errors
    }

    async extract(): Promise<[src: ImageInfo, dst: ImageInfo | null][]> {
        this._status = ExtractorSt.extracting

        const srcInfoArr = this.findImages()
        let count = 0

        const result: ReturnType<MkdImgExtractor['extract']> extends Promise<infer U> ? U : never = []

        for (const srcInfo of srcInfoArr) {
            if (this.onProgress) this.onProgress(count++, srcInfoArr)

            // reuse resolved link
            const resolvedLink = result.find(([src, dst]) => dst != null && src.data === srcInfo.data)?.[1]?.data

            const streamOrLink = resolvedLink ?? (await this.resolveImgInfo(srcInfo))

            const dstInfo = await (async () => {
                if (streamOrLink === undefined) return null
                try {
                    const newLink = isString(streamOrLink) ? streamOrLink : await ImageService.upload(streamOrLink)

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

    findImages(): ImageInfo[] {
        const acc = () => {
            const imgTagUrlImgMatchGroups = Array.from(this.markdown.matchAll(imgTagUrlImgPat))
            const mkdUrlImgMatchGroups = Array.from(this.markdown.matchAll(mkdUrlImgPat))
            const urlImgInfo = imgTagUrlImgMatchGroups.concat(mkdUrlImgMatchGroups).map<ImageInfo>(mg => ({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                startOffset: mg.index!,
                dataType: DataType.url,
                data: mg[2],
                prefix: mg[1],
                postfix: mg[3],
            }))

            const imgTagDataUrlImgMatchGroups = Array.from(this.markdown.matchAll(imgTagDataUrlImgPat))
            const mkdDataUrlImgMatchGroups = Array.from(this.markdown.matchAll(mkdDataUrlImgPat))
            const dataUrlImgInfo = imgTagDataUrlImgMatchGroups.concat(mkdDataUrlImgMatchGroups).map<ImageInfo>(mg => ({
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
            return acc.filter(x => !cnblogsDomainRegExp.test(x.data))
        }

        this._images ??= acc()

        // apply settings
        return this._images.filter(x => newImageSrcFilter(this._imageSrc)(x))
    }

    private async resolveWebImg(url: string) {
        try {
            return await ImageService.download(url)
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            this._errors.push([url, `无法下载网络图片: ${e}`])
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

            searchingDirs ??= [path.dirname(this.targetFileUri.fsPath), ...(this._workspaceDirs ?? [])]
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

    private async resolveImgInfo(info: ImageInfo): Promise<Readable | undefined> {
        // for web img
        // eslint-disable-next-line no-return-await
        if (newImageSrcFilter(ImageSrc.web)(info)) return await this.resolveWebImg(info.data)

        // for fs img
        // eslint-disable-next-line no-return-await
        if (newImageSrcFilter(ImageSrc.fs)(info)) return await this.resolveFsImg(info.data)

        // for data url img
        if (newImageSrcFilter(ImageSrc.dataUrl)(info)) return this.resolveDataUrlImg(info.data)
    }
}
