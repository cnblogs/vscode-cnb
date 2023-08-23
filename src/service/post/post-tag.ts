import { PostTag } from '@/model/post-tag'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'
import { ExtConst } from '@/ctx/ext-const'

let cachedTags: PostTag[] | null = null

export namespace PostTagService {
    export async function fetchTags(forceRefresh = false): Promise<PostTag[]> {
        if (cachedTags !== null && !forceRefresh) return cachedTags

        const url = `${ExtConst.ApiBase.BLOG_BACKEND}/tags/list`
        const resp = await AuthedReq.get(url, consHeader())
        const list = <PostTag[]>JSON.parse(resp)

        if (!Array.isArray(list)) return []

        cachedTags = list.map((x: PostTag) => Object.assign(new PostTag(), x)).filter(({ name: tagName }) => tagName)
        return cachedTags
    }
}
