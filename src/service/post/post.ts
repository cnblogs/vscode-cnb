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
import { PostReq } from '@/wasm'
import { PostListModel } from '@/service/post/post-list-view'

async function getAuthedPostReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new PostReq(token, isPatToken)
}

export namespace PostService {
    export async function search(pageIndex: number, pageCap: number, keyword?: string, catId?: number) {
        const req = await getAuthedPostReq()
        try {
            const json = await req.search(pageIndex, pageCap, keyword, catId)
            const listModel = <PostListModel>JSON.parse(json)
            const page = {
                index: listModel.pageIndex,
                cap: listModel.pageSize,
                items: listModel.postList.map(x => Object.assign(new Post(), x)),
            } as Page<Post>

            return {
                page,
                pageCount: PageList.calcPageCount(listModel.pageSize, listModel.postsCount),
                matchedPostCount: listModel.postsCount,
                zzkResult: listModel.zzkSearchResult,
            }
        } catch (e) {
            void Alert.err(`搜索失败: ${<string>e}`)
            throw e
        }
    }

    export async function getList(pageIndex: number, pageCap: number) {
        const req = await getAuthedPostReq()
        try {
            const resp = await req.getList(pageIndex, pageCap)
            return <PostListRespItem[]>JSON.parse(resp)
        } catch (e) {
            void Alert.err(`获取随笔列表失败: ${<string>e}`)
            return []
        }
    }

    export async function getCount() {
        const req = await getAuthedPostReq()
        try {
            return await req.getCount()
        } catch (e) {
            void Alert.err(`获取随笔列表失败: ${<string>e}`)
            return 0
        }
    }

    // TODO: need better impl
    export async function* iterAll() {
        const postCount = await getCount()
        for (const i of Array(postCount).keys()) {
            const list = await PostService.getList(i + 1, 1)
            const id = list[0].id
            const dto = await PostService.getPostEditDto(id)
            yield dto.post
        }
    }

    export async function getPostEditDto(postId: number) {
        const req = await getAuthedPostReq()
        try {
            const resp = await req.getOne(postId)

            // TODO: need better impl
            const { blogPost, myConfig } = <{ blogPost?: Post; myConfig?: MyConfig }>JSON.parse(resp)
            if (blogPost === undefined) throw Error('博文不存在')

            return <PostEditDto>{
                post: Object.assign(new Post(), blogPost),
                config: myConfig,
            }
        } catch (e) {
            void Alert.err(`获取博文失败: ${<string>e}`)
            throw e
        }
    }

    export async function del(...postIds: number[]) {
        const req = await getAuthedPostReq()
        try {
            if (postIds.length === 1) await req.delOne(postIds[0])
            else await req.delSome(new Uint32Array(postIds))
        } catch (e) {
            void Alert.err(`删除博文失败: ${<string>e}`)
        }
    }

    export async function update(post: Post) {
        if (MarkdownCfg.isIgnoreYfmWhenUploadPost()) post.postBody = rmYfm(post.postBody)
        const body = JSON.stringify(post)
        const req = await getAuthedPostReq()
        const resp = await req.update(body)

        return <PostUpdatedResp>JSON.parse(resp)
    }

    // TODO: need caahe
    export async function getTemplate() {
        const req = await getAuthedPostReq()
        try {
            const resp = await req.getTemplate()

            // TODO: need better impl
            const template = <{ blogPost?: Post; myConfig?: MyConfig }>JSON.parse(resp)

            return <PostEditDto>{
                post: Object.assign(new Post(), template.blogPost),
                config: template.myConfig,
            }
        } catch (e) {
            void Alert.err(`获取模板失败: ${<string>e}`)
            throw e
        }
    }
}
