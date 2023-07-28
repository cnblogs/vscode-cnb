import { globalCtx } from './global-ctx'
import { Readable } from 'stream'
import { isString, merge, pick } from 'lodash-es'
import httpClient from '@/utils/http-client'
import path from 'path'

class ImageService {
    async upload<T extends Readable & { name?: string; fileName?: string; filename?: string; path?: string | Buffer }>(
        file: T
    ) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { name, fileName, filename, path: _path } = file
        const finalName = path.basename(isString(_path) ? _path : fileName || filename || name || 'image.png')
        const ext = path.extname(finalName)

        const mime = await import('mime')
        const mimeType = mime.lookup(ext, 'image/png')

        const fd = new (await import('form-data')).default()
        fd.append('image', file, { filename: finalName, contentType: mimeType })

        const response = await httpClient.post(`${globalCtx.config.apiBaseUrl}/api/posts/body/images`, {
            body: fd,
        })

        return response.body
    }

    /**
     * Download the image from web
     * This will reject if failed to download
     * @param url The url of the web image
     * @param name The name that expected applied to the downloaded image
     * @returns The {@link Readable} stream
     */
    async download(url: string, name?: string): Promise<Readable> {
        const response = await httpClient.get(url, { responseType: 'buffer' })
        const contentType = response.headers['content-type'] ?? 'image/png'
        name = !name ? 'image' : name
        const mime = await import('mime')

        return merge(Readable.from(response.body), {
            ...pick(response, 'httpVersion', 'headers'),
            path: `${name}.${mime.extension(contentType) ?? 'png'}`,
        })
    }
}

export const imageService = new ImageService()
