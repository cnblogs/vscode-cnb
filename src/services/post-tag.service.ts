import { PostTag } from '@/models/post-tag'
import got from '@/utils/http-client'
import { globalCtx } from './global-ctx'

let cachedTags: PostTag[] | null = null

export namespace PostTagService {
    export async function fetchTags(forceRefresh = false): Promise<PostTag[]> {
        if (cachedTags && !forceRefresh) return cachedTags

        const {
            ok: isOk,
            url,
            method,
            body,
        } = await got.get<PostTag[]>(`${globalCtx.config.apiBaseUrl}/api/tags/list`, { responseType: 'json' })

        if (!isOk) throw Error(`Failed to ${method} ${url}`)

        if (Array.isArray(body)) {
            cachedTags = body
                .map((x: PostTag) => Object.assign(new PostTag(), x))
                .filter(({ name: tagName }) => tagName)
            return cachedTags
        }

        return []
    }
}
