import path from 'path';
import fs from 'fs';
import { Uri, workspace } from 'vscode';
import { imageService } from './image.service';
import { isErrorResponse } from '../models/error-response';
import { promisify } from 'util';
import { Stream } from 'stream';

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

interface ImageTypeFilter {
    (image: MarkdownImage): boolean;
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
    private _errors: [symbol: string, message: string][] = [];
    private _images: MarkdownImages | null | undefined = null;
    private readonly _workspaceDirs: string[] | undefined;

    constructor(
        private readonly markdown: string,
        private readonly targetFileUri: Uri,
        public progressHook?: (index: number, images: MarkdownImages) => void
    ) {
        this._workspaceDirs = workspace.workspaceFolders?.map(({ uri: { fsPath } }) => fsPath);
    }

    get status() {
        return this._status;
    }
    get errors() {
        return this._errors;
    }

    async extract(): Promise<[source: MarkdownImage, result: MarkdownImage | null][]> {
        this._status = 'extracting';
        const sourceImages = this.findImages();
        let idx = 0;
        const result: ReturnType<MarkdownImagesExtractor['extract']> extends Promise<infer U> ? U : never = [];
        for (const image of sourceImages) {
            this.progressHook?.call(this, idx++, sourceImages);
            let newImageLink = result.find(x => x[1] != null && x[0].link === image.link)?.[1]?.link;
            const imageStream = newImageLink ? newImageLink : await this.resolveImageFile(image);
            if (imageStream != null) {
                try {
                    newImageLink =
                        typeof imageStream === 'string' ? imageStream : await imageService.upload(imageStream);
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
        return (
            this._images == null
                ? (this._images = Array.from(this.markdown.matchAll(markdownImageRegex))
                      .map<MarkdownImage>(g => ({
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

    private async resolveImageFile(image: MarkdownImage): Promise<Stream | undefined | null> {
        const { link, symbol, alt, title } = image;
        if (webImageFilter(image)) {
            const imageStream = await imageService.download(link, alt ?? title);
            if (!(imageStream instanceof Array)) {
                return imageStream;
            } else {
                this._errors.push([symbol, `无法下载网络图片, ${imageStream[0]} - ${imageStream[2]}`]);
                return undefined;
            }
        } else {
            const checkReadAccess = (filePath: string) =>
                promisify(fs.access)(filePath).then(
                    () => true,
                    () => false
                );

            let iPath: string | undefined | null = link,
                iDir = 0,
                searchingDirs: string[] | undefined | null,
                triedPath: string[] | undefined,
                isEncodedPath = false;

            while (iPath != null) {
                if (await checkReadAccess(iPath)) {
                    return fs.createReadStream(iPath);
                } else {
                    (triedPath ??= []).push(iPath);

                    if (!isEncodedPath) {
                        iPath = decodeURIComponent(iPath);
                        isEncodedPath = true;
                        continue;
                    }
                }

                searchingDirs ??= [path.dirname(this.targetFileUri.fsPath), ...(this._workspaceDirs ?? [])];
                iPath = iDir >= 0 && searchingDirs.length > iDir ? path.resolve(searchingDirs[iDir], link) : undefined;
                iDir++;
                isEncodedPath = false;
            }

            return undefined;
        }
    }
}
