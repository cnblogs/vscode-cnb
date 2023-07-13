import path from 'path'
import fs from 'fs'
import { Uri, workspace } from 'vscode'
import { imageService } from './image.service'
import { isErrorResponse } from '@/models/error-response'
import { isString } from 'lodash-es'
import { promisify } from 'util'
import { Readable } from 'stream'

export interface ImageInfo {
    startOffset: number
    prefix: string
    link: string
    postfix: string
}

const imgTagImgRegExp = /(<img.*?src\s*=\s*")(.*\.(?:png|jpg|jpeg|webp|svg|gif))("[^\\]*?\/>)/gi
const mkdImgRegExp = /(!\[.*?\]\()(.*?\.(?:png|jpg|jpeg|webp|svg|gif))(\))/gi
const cnblogsDomainRegExp = /\.cnblogs\.com\//gi

export const enum ImageSrc {
    web,
    local,
    any,
}

export const newImageSrcFilter = (type: ImageSrc) => {
    const isWebImage = (imgInfo: ImageInfo) => /https?:\/\//.test(imgInfo.link)
    const isLocalImage = (imgInfo: ImageInfo) => !isWebImage(imgInfo)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isAnyImage = (_: ImageInfo) => true

    switch (type) {
        case ImageSrc.web:
            return isWebImage
        case ImageSrc.local:
            return isLocalImage
        case ImageSrc.any:
            return isAnyImage
    }
}

enum ExtractorSt {
    pending,
    extracting,
    extracted,
}

export class MarkdownImagesExtractor {
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

        const result: ReturnType<MarkdownImagesExtractor['extract']> extends Promise<infer U> ? U : never = []

        for (const srcInfo of srcInfoArr) {
            if (this.onProgress) this.onProgress(count++, srcInfoArr)

            // reuse resolved link
            const resolvedLink = result.find(([src, dst]) => dst != null && src.link === srcInfo.link)?.[1]?.link

            const stream = resolvedLink ?? (await this.resolveImageFile(srcInfo))

            const dstInfo = await (async () => {
                if (stream == null) return null

                try {
                    const newLink = isString(stream) ? stream : await imageService.upload(stream)

                    return {
                        ...srcInfo,
                        link: newLink,
                    }
                } catch (e) {
                    const errMsg = `上传图片失败, ${isErrorResponse(e) ? e.errors.join(',') : JSON.stringify(e)}`
                    this._errors.push([srcInfo.link, errMsg])
                    return null
                }
            })()

            result.push([srcInfo, dstInfo])
        }

        this._status = ExtractorSt.extracted

        return result
    }

    findImages(): ImageInfo[] {
        const mkdImgMatchGroup = Array.from(this.markdown.matchAll(mkdImgRegExp))
        const imgTagImgMatchGroup = Array.from(this.markdown.matchAll(imgTagImgRegExp))
        const matchGroupAcc = mkdImgMatchGroup.concat(imgTagImgMatchGroup)

        this._images ??= matchGroupAcc
            .map<ImageInfo>(mg => ({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                startOffset: mg.index!,
                prefix: mg[1],
                link: mg[2],
                postfix: mg[3],
            }))
            .filter(x => !cnblogsDomainRegExp.test(x.link))

        return this._images.filter(x => newImageSrcFilter(this._imageSrc)(x))
    }

    private async resolveImageFile(info: ImageInfo): Promise<Readable | undefined> {
        // for web img
        if (newImageSrcFilter(ImageSrc.web)(info)) {
            const stream = await imageService.download(info.link)
            // TODO: fix warning here
            if (stream instanceof Array) {
                this._errors.push([info.link, `无法下载网络图片, ${stream[0]} - ${stream[2]}`])
                return
            }
            return stream
        }

        // for local img
        const checkReadAccess = (filePath: string) =>
            promisify(fs.access)(filePath).then(
                () => true,
                () => false
            )

        let iPath: string | undefined | null = info.link
        let iDir = 0
        let searchingDirs: string[] | undefined | null
        let triedPath: string[] | undefined
        let isEncodedPath = false

        while (iPath != null) {
            if (await checkReadAccess(iPath)) {
                return fs.createReadStream(iPath)
            } else {
                triedPath ??= []
                triedPath.push(iPath)

                if (!isEncodedPath) {
                    iPath = decodeURIComponent(iPath)
                    isEncodedPath = true
                    continue
                }
            }

            searchingDirs ??= [path.dirname(this.targetFileUri.fsPath), ...(this._workspaceDirs ?? [])]
            iPath = iDir >= 0 && searchingDirs.length > iDir ? path.resolve(searchingDirs[iDir], info.link) : undefined
            iDir++
            isEncodedPath = false
        }
    }
}
