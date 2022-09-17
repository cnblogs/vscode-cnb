import path from 'path';
import fs from 'fs';
import { Uri } from 'vscode';
import { imageService } from './image.service';
import { isErrorResponse } from '../models/error-response';

export interface MarkdownImage {
    link: string;
    symbol: string;
    alt: string;
    title: string;
    index?: number;
}

export type MarkdownImages = MarkdownImage[];

const markdownImageRegex = /(!\[.*?\])\((.*?)( {0,}["'].*?['"])?\)/g;
const cnblogsImageLinkRegex = /\.cnblogs\.com\//;

export class MarkdownImagesExtractor {
    get status() {
        return this._status;
    }
    get errors() {
        return this._errors;
    }
    readonly markdownImageRegex = markdownImageRegex;

    private _status: 'pending' | 'extracting' | 'extracted' = 'pending';
    private _errors: [symbol: string, message: string][] = [];
    private _images: MarkdownImages | null | undefined = null;

    constructor(
        private markdown: string,
        private path: Uri,
        public onProgress?: (index: number, images: MarkdownImages) => void
    ) {}

    async extract(): Promise<[source: MarkdownImage, result: MarkdownImage | null][]> {
        this._status = 'extracting';
        const sourceImages = this.findImages();
        let idx = 0;
        let result: ReturnType<MarkdownImagesExtractor['extract']> extends Promise<infer U> ? U : never = [];
        for (let image of sourceImages) {
            this.onProgress?.call(this, idx++, sourceImages);
            let newImageLink = result.find(x => x[1] != null && x[0].link === image.link)?.[1]?.link ?? '';
            const imageFile = newImageLink ? false : await this.resolveImageFile(image);
            if (imageFile !== false || newImageLink.length > 0) {
                try {
                    newImageLink = newImageLink ? newImageLink : await imageService.upload(imageFile);
                } catch (ex) {
                    this._errors.push([
                        image.symbol,
                        `上传图片失败, ${isErrorResponse(ex) ? ex.errors.join(',') : JSON.stringify(ex)}`,
                    ]);
                }
                result.push([
                    image,
                    newImageLink
                        ? Object.assign({}, image, {
                              link: newImageLink,
                              symbol: `![${image.alt}](${newImageLink}${image.title})`,
                          } as MarkdownImage)
                        : null,
                ]);
            } else {
                result.push([image, null]);
            }
        }
        this._status = 'extracted';
        return result;
    }

    findImages(): MarkdownImage[] {
        return this._images == null
            ? (this._images = Array.from(this.markdown.matchAll(markdownImageRegex))
                  .map<MarkdownImage>(g => ({
                      link: g[2],
                      symbol: g[0],
                      alt: g[1].substring(2, g[1].length - 1),
                      title: g[3] ?? '',
                      index: g.index,
                  }))
                  .filter(x => !cnblogsImageLinkRegex.test(x.link)))
            : this._images;
    }

    private async resolveImageFile({ link, symbol, alt, title }: MarkdownImage) {
        if (/^https?:\/\//.test(link)) {
            let imageStream = await imageService.download(link, alt ?? title);
            if (!(imageStream instanceof Array)) {
                return imageStream;
            } else {
                this._errors.push([symbol, `无法下载网络图片, ${imageStream[0]} - ${imageStream[2]}`]);
                return false;
            }
        } else {
            const createReadStream = (file: string) => (fs.existsSync(file) ? fs.createReadStream(file) : false);
            let stream = createReadStream(link);
            return stream === false ? createReadStream(path.resolve(this.path.fsPath, link)) : stream;
        }
    }
}
