import { Ing, IngComment, IngPublishModel, IngType } from '@/model/ing'
import { Alert } from '@/infra/alert'
import { globalCtx } from '@/ctx/global-ctx'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { consHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { AuthedReq } from '@/infra/http/authed-req'
import ContentType = ReqHeaderKey.ContentType

async function getIngComment(id: number) {
    const url = `${globalCtx.config.openApiUrl}/api/statuses/${id}/comments`
    const header = consHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appJson])
    const resp = await AuthedReq.get(url, header)
    const list = JSON.parse(resp) as []
    return list.map(IngComment.parse)
}

export namespace IngApi {
    export async function publishIng(ing: IngPublishModel): Promise<boolean> {
        const url = `${globalCtx.config.openApiUrl}/api/statuses`
        const header = consHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appJson])
        const body = JSON.stringify(ing)

        try {
            await AuthedReq.post(url, header, body)
            return true
        } catch (e) {
            void Alert.err(`闪存发布失败: ${<string>e}`)
            return false
        }
    }

    export async function list({ pageIndex = 1, pageSize = 30, type = IngType.all } = {}) {
        const para = consUrlPara(['pageIndex', `${pageIndex}`], ['pageSize', `${pageSize}`])
        const header = consHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appJson])

        const url = `${globalCtx.config.openApiUrl}/api/statuses/@${type}?${para}`

        let list: Ing[]
        try {
            const resp = await AuthedReq.get(url, header)
            const arr = JSON.parse(resp) as unknown[]
            list = arr.map(Ing.parse)
        } catch (e) {
            void Alert.err(`获取闪存列表失败: ${<string>e}`)
            list = []
        }

        return list
    }

    export async function listComments(...ingIds: number[]) {
        const futList = ingIds.map(async id => {
            const comment = await getIngComment(id)
            return { [id]: comment }
        })
        const resList = await Promise.all(futList)
        return resList.reduce((acc, it) => Object.assign(it, acc), {})
    }

    export async function comment(
        ingId: number,
        data: {
            replyTo?: number
            parentCommentId?: number
            content: string
        }
    ) {
        const url = `${globalCtx.config.openApiUrl}/api/statuses/${ingId}/comments`
        const header = consHeader([ReqHeaderKey.CONTENT_TYPE, ContentType.appJson])
        const body = JSON.stringify(data)

        try {
            await AuthedReq.post(url, header, body)
            return true
        } catch (e) {
            void Alert.err(`发表评论失败, ${<string>e}`)
            return false
        }
    }
}
