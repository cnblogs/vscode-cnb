import fetch from 'node-fetch';
import FormData from 'form-data';
import { accountService } from './account.service';
import { globalState } from './global-state';
import { throwIfNotOkResponse } from '../utils/throw-if-not-ok-response';
import { Stream } from 'stream';
import mime from 'mime';

export class ImageService {
    private static _instance: ImageService;
    static get instance() {
        if (!this._instance) this._instance = new ImageService();

        return this._instance;
    }

    private constructor() {}

    async upload<T extends object>(file: T): Promise<string> {
        const form = new FormData();
        let { name: filename } = <{ name?: string }>file;
        filename ??= 'image.png';
        form.append('image', file, {
            filename,
            contentType: 'image/png',
        });
        const response = await fetch(`${globalState.config.apiBaseUrl}/api/posts/body/images`, {
            method: 'POST',
            headers: [accountService.buildBearerAuthorizationHeader()],
            body: form,
        });
        await throwIfNotOkResponse(response);
        return response.text();
    }

    async download(
        link: string,
        fileNameWithoutExtension?: string
    ): Promise<Stream | [statusCode: number, statusText: string, responseBody: string]> {
        const response = await fetch(link, {
            method: 'get',
        });
        const contentType = response.headers.get('content-type') ?? 'image/png';
        fileNameWithoutExtension = !fileNameWithoutExtension ? 'image' : fileNameWithoutExtension;
        return response.ok && response.body != null
            ? Object.assign(Stream.Readable.from(await response.buffer()), {
                  path: fileNameWithoutExtension + '.' + (mime.extension(contentType) ?? ''),
              })
            : [response.status, response.statusText, await response.text()];
    }
}

export const imageService = ImageService.instance;
