import { PostEditDto } from '@/model/post-edit-dto'
import { PostUpdatedResp } from '@/model/post-updated-response'
import { MarkdownCfg } from '@/ctx/cfg/markdown'
import { rmYfm } from '@/infra/filter/rm-yfm'
import { Alert } from '@/infra/alert'
import { Page, PageList } from '@/model/page'
import { Post } from '@/model/post'
import { PostListRespItem } from '@/model/post-list-resp-item'
import { MyConfig } from '@/model/my-config'
import { AuthManager } from '@/auth/auth-manager'
import { PostReq, Token } from '@/wasm'
import { PostListModel } from '@/service/post/post-list-view'
import { ExtConst } from '@/ctx/ext-const'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'
import { consUrlPara } from '@/infra/http/infra/url-para'

async function getAuthedPostReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new PostReq(new Token(token, isPatToken))
}

export class PostService {
    static async search(pageIndex: number, pageCap: number, keyword?: string, catId?: number) {
        const req = await getAuthedPostReq()
        try {
            const json = await req.search(pageIndex, pageCap, keyword, catId)
            const listModel = JSON.parse(json) as PostListModel
            const page = {
                index: listModel.pageIndex,
                size: listModel.pageSize,
                count: PageList.calcPageCount(pageCap, listModel.postsCount),
                items: listModel.postList.map(x => Object.assign(new Post(), x)),
            } as Page<Post>

            return {
                page,
                pageCount: PageList.calcPageCount(listModel.pageSize, listModel.postsCount),
                matchedPostCount: listModel.postsCount,
                zzkResult: listModel.zzkSearchResult,
            }
        } catch (e) {
            void Alert.err(`搜索失败: ${e as string}`)
            throw e
        }
    }

    static async getPosts({ pageIndex = 1, pageSize = 30, categoryId = '' as '' | number, search = '' }) {
        const para = consUrlPara(
            ['t', '1'],
            ['p', pageIndex.toString()],
            ['s', pageSize.toString()],
            ['search', search],
            ['cid', categoryId.toString()]
        )
        const url = `${ExtConst.ApiBase.BLOG_BACKEND}/posts/list?${para}`
        const resp = await AuthedReq.get(url, consHeader())
        return JSON.parse(resp) as PostListModel
    }

    static async getList(pageIndex: number, pageCap: number) {
        const req = await getAuthedPostReq()
        try {
            const resp = await req.getList(pageIndex, pageCap)
            return JSON.parse(resp) as PostListRespItem[]
        } catch (e) {
            void Alert.err(`获取随笔列表失败: ${e as string}`)
            return []
        }
    }

    static async getCount() {
        const req = await getAuthedPostReq()
        try {
            return await req.getCount()
        } catch (e) {
            void Alert.err(`获取随笔列表失败: ${e as string}`)
            return 0
        }
    }

    // TODO: need better impl
    static async* iterAll() {
        const postCount = await PostService.getCount()
        for (const i of Array(postCount).keys()) {
            const list = await PostService.getList(i + 1, 1)
            const id = list[0].id
            const dto = await PostService.getPostEditDto(id)
            yield dto.post
        }
    }

    static async getPostEditDto(postId: number) {
        const req = await getAuthedPostReq()
        try {
            const resp = await req.getOne(postId)

            // TODO: need better impl
            const { blogPost, myConfig } = JSON.parse(resp) as { blogPost?: Post; myConfig?: MyConfig }
            if (blogPost === undefined) throw Error('博文不存在')

            return {
                post: Object.assign(new Post(), blogPost),
                config: myConfig,
            } as PostEditDto
        } catch (e) {
            void Alert.err(`获取博文失败: ${e as string}`)
            throw e
        }
    }

    static async del(...postIds: number[]) {
        const req = await getAuthedPostReq()
        try {
            if (postIds.length === 1) await req.delOne(postIds[0])
            else await req.delSome(new Uint32Array(postIds))
        } catch (e) {
            void Alert.err(`删除博文失败: ${e as string}`)
        }
    }

    static async update(post: Post) {
        if (MarkdownCfg.isIgnoreYfmWhenUploadPost()) post.postBody = rmYfm(post.postBody)

        if (post.postBody === '') void Alert.warn('博文内容不能为空（发生于 http post 请求之前）')

        const body = JSON.stringify(post)
        const req = await getAuthedPostReq()
        const resp = await req.update(body)

        return JSON.parse(resp) as PostUpdatedResp
    }

    // TODO: need caahe
    static async getTemplate() {
        const req = await getAuthedPostReq()
        try {
            const resp = await req.getTemplate()

            // TODO: need better impl
            const template = JSON.parse(resp) as { blogPost?: Post; myConfig?: MyConfig }

            return {
                post: Object.assign(new Post(), template.blogPost),
                config: template.myConfig,
            } as PostEditDto
        } catch (e) {
            void Alert.err(`获取模板失败: ${e as string}`)
            throw e
        }
    }
}
