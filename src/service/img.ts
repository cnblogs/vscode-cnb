import { Readable } from 'stream'
import { isString, merge, pick } from 'lodash-es'
import httpClient from '@/infra/http-client'
import path from 'path'
import { lookup, extension } from 'mime-types'
import { AppConst } from '@/ctx/app-const'

export namespace ImgService {
    export async function upload<
        T extends Readable & {
            name?: string
            fileName?: string
            filename?: string
            path?: string | Buffer
        },
    >(file: T) {
        const { name, fileName, filename, path: _path } = file
        const finalName = path.basename(isString(_path) ? _path : fileName || filename || name || 'image.png')
        const ext = path.extname(finalName)

        let mimeType = lookup(ext)
        if (mimeType === false) mimeType = 'image/png'

        const fd = new (await import('form-data')).default()
        fd.append('image', file, { filename: finalName, contentType: mimeType })

        const url = `${AppConst.ApiBase.BLOG_BACKEND}/posts/body/images`

        const resp = await httpClient.post(url, {
            body: fd,
        })

        return resp.body
    }

    /**
     * Download the image from web
     * This will reject if failed to download
     * @param url The url of the web image
     * @param name The name that expected applied to the downloaded image
     * @returns The {@link Readable} stream
     */
    export async function download(url: string, name = 'image'): Promise<Readable> {
        const resp = await httpClient.get(url, { responseType: 'buffer' })
        const contentType = resp.headers['content-type'] ?? 'image/png'

        const readable = Readable.from(resp.body)

        return merge(readable, {
            ...pick(resp, 'httpVersion', 'headers'),
            path: `${name}.${extension(contentType) ?? 'png'}`,
        })
    }
}
