import path from 'path';
import fs from 'fs';
import { Uri } from 'vscode';
import { imageService } from './image.service';
import { isErrorResponse } from '../models/error-response';
import { isString, trimEnd } from 'lodash-es';
import { Readable } from 'stream';

export interface ImageInformation {
    link: string;
    symbol: string;
    alt: string;
    title: string;
    index?: number;
}

export type ImageInformationArray = ImageInformation[];

const markdownImageRegex = /(!\[.*?\])\((.*?)( {0,}["'].*?['"])?\)/g;
const cnblogsImageLinkRegex = /\.cnblogs\.com\//;

interface ImageTypeFilter {
    (image: ImageInformation): boolean;
}

const webImageFilter: ImageTypeFilter = image => /^(https?:)?\/\//.test(image.link);
const localImageFilter: ImageTypeFilter = image => !webImageFilter(image);
const allImageFilter: ImageTypeFilter = () => true;
const createImageTypeFilter = (type: MarkdownImagesExtractor['imageType']) => {
    switch (type) {
        case 'web':
            return webImageFilter;
        case 'local':
            return localImageFilter;
        default:
            return allImageFilter;
    }
};

export class MarkdownImagesExtractor {
    imageType: 'web' | 'local' | 'all' = 'all';
    readonly markdownImageRegex = markdownImageRegex;
    readonly createImageTypeFilter = createImageTypeFilter;

    private _status: 'pending' | 'extracting' | 'extracted' = 'pending';
    private _errors: [imageSymbol: string, message: string][] = [];
    private _images: ImageInformationArray | null | undefined = null;

    constructor(
        private markdown: string,
        private filePath: Uri,
        public onProgress?: (index: number, images: ImageInformationArray) => void
    ) {}

    get status() {
        return this._status;
    }
    get errors() {
        return this._errors;
    }

    async extract(): Promise<[source: ImageInformation, result: ImageInformation | null][]> {
        this._status = 'extracting';
        const sourceImages = this.findImages();
        let idx = 0;
        const result: ReturnType<MarkdownImagesExtractor['extract']> extends Promise<infer U> ? U : never = [];
        for (const image of sourceImages) {
            this.onProgress?.call(this, idx++, sourceImages);
            let newImageLink = result.find(x => x[1] != null && x[0].link === image.link)?.[1]?.link;
            const imageFile = newImageLink ? newImageLink : await this.resolveImageFile(image);
            if (imageFile !== false) {
                try {
                    newImageLink = isString(imageFile) ? imageFile : await imageService.upload(imageFile);
                } catch (ex) {
                    this._errors.push([
                        image.symbol,
                        `上传图片失败, ${isErrorResponse(ex) ? ex.errors.join(',') : JSON.stringify(ex)}`,
                    ]);
                }
                result.push([
                    image,
                    newImageLink
                        ? {
                              ...image,
                              link: newImageLink,
                              symbol: `![${image.alt}](${newImageLink}${image.title})`,
                          }
                        : null,
                ]);
            } else {
                result.push([image, null]);
            }
        }
        this._status = 'extracted';
        return result;
    }

    findImages(): ImageInformation[] {
        return (
            this._images == null
                ? (this._images = Array.from(this.markdown.matchAll(markdownImageRegex))
                      .map<ImageInformation>(g => ({
                          link: g[2],
                          symbol: g[0],
                          alt: g[1].substring(2, g[1].length - 1),
                          title: g[3] ?? '',
                          index: g.index,
                      }))
                      .filter(x => !cnblogsImageLinkRegex.test(x.link)))
                : this._images
        ).filter(x => createImageTypeFilter(this.imageType).call(null, x));
    }

    private async resolveImageFile(image: ImageInformation) {
        const { link, symbol, alt, title } = image;
        if (webImageFilter(image)) {
            const imageStream = await imageService
                .download(link, alt ?? title)
                .catch(reason => this._errors.push([symbol, trimEnd(`下载图片失败, ${reason}`, ', ')]));
            return imageStream instanceof Readable ? imageStream : false;
        } else {
            const triedPaths: string[] = [];
            const createReadStream = (file: string) => {
                triedPaths.push(file);
                return fs.existsSync(file) ? fs.createReadStream(file) : false;
            };
            let stream = createReadStream(link);

            stream =
                stream === false ? createReadStream(path.resolve(path.dirname(this.filePath.fsPath), link)) : stream;
            if (stream === false)
                this._errors.push([symbol, `本地图片文件不存在(已搜索路径: ${triedPaths.join(', ')})`]);

            return stream;
        }
    }
}
