import { Ing, IngComment, IngPublishModel, IngType } from '@/model/ing'
import { Alert } from '@/infra/alert'
import { globalCtx } from '@/ctx/global-ctx'
import fetch from '@/infra/fetch-client'
import { consUrlPara } from '@/infra/http/infra/url'
import { consReqHeader, ReqHeaderKey } from '@/infra/http/infra/header'
import { AuthedReq } from '@/infra/http/authed-req'

async function getIngComment(id: number) {
    const url = `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/${id}/comments`
    const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/json'])
    const resp = await AuthedReq.get(url, header)
    const list = JSON.parse(resp) as []
    return list.map(IngComment.parse)
}

export namespace IngApi {
    export async function publishIng(ing: IngPublishModel): Promise<boolean> {
        const url = `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses`
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/json'])
        const body = JSON.stringify(ing)

        try {
            await AuthedReq.post(url, header, body)
            return true
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`闪存发布失败: ${e}`)
            return false
        }
    }

    export async function list({ pageIndex = 1, pageSize = 30, type = IngType.all } = {}) {
        const para = consUrlPara(['pageIndex', `${pageIndex}`], ['pageSize', `${pageSize}`])
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/json'])

        const url = `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/@${type}?${para}`

        let list: Ing[]
        try {
            const resp = await AuthedReq.get(url, header)
            const arr = JSON.parse(resp) as unknown[]
            list = arr.map(Ing.parse)
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`获取闪存列表失败: ${e}`)
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
        const url = `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/${ingId}/comments`
        const header = consReqHeader([ReqHeaderKey.CONTENT_TYPE, 'application/json'])
        const body = JSON.stringify(data)

        try {
            await AuthedReq.post(url, header, body)
            return true
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`发表评论失败, ${e}`)
            return false
        }
    }
}
