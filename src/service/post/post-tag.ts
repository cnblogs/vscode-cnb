import { PostTag } from '@/model/post-tag'
import { globalCtx } from '@/ctx/global-ctx'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'

let cachedTags: PostTag[] | null = null

export namespace PostTagService {
    export async function fetchTags(forceRefresh = false): Promise<PostTag[]> {
        if (cachedTags && !forceRefresh) return cachedTags

        const url = `${globalCtx.config.apiBaseUrl}/api/tags/list`
        const resp = await AuthedReq.get(url, consHeader())
        const list = <PostTag[]>JSON.parse(resp)

        if (!Array.isArray(list)) return []

        cachedTags = list.map((x: PostTag) => Object.assign(new PostTag(), x)).filter(({ name: tagName }) => tagName)
        return cachedTags
    }
}
