import { Readable } from 'stream'
import { isString, merge, pick } from 'lodash-es'
import httpClient from '@/infra/http-client'
import path from 'path'
import { lookup, extension } from 'mime-types'
import { AppConst } from '@/ctx/app-const'

export namespace ImgService {
    export async function upload(
        file: Readable & {
            name?: string
            fileName?: string
            filename?: string
            path?: string | Buffer
        }
    ) {
        let finalName: string
        if (isString(file.path)) finalName = file.path
        else if (file.filename !== undefined) finalName = file.filename
        else if (file.fileName !== undefined) finalName = file.fileName
        else if (file.name !== undefined) finalName = file.name
        else finalName = 'image.png'

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
