import { Ing, IngComment, IngPublishModel, IngType } from '@/model/ing'
import { Alert } from '@/infra/alert'
import { globalCtx } from '@/ctx/global-ctx'
import fetch from '@/infra/fetch-client'
import { Http } from '@/infra/http/get'
import { consReqHeader } from '@/infra/http/infra/consReqHeader'
import { consUrlPara } from '@/infra/http/infra/consUrlPara'

async function getIngComment(id: number) {
    const url = `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/${id}/comments`
    const header = consReqHeader(['Content-Type', 'application/json'])
    const resp = await Http.get(url, header)
    const list = JSON.parse(resp) as []
    return list.map(IngComment.parse)
}

export namespace IngApi {
    export async function publishIng(ing: IngPublishModel): Promise<boolean> {
        const res = await fetch(`${globalCtx.config.cnblogsOpenApiUrl}/api/statuses`, {
            method: 'POST',
            body: JSON.stringify(ing),
            headers: [['Content-Type', 'application/json']],
        }).catch(reason => void Alert.warn(JSON.stringify(reason)))

        if (!res || !res.ok)
            void Alert.err(`闪存发布失败, ${res?.statusText ?? ''} ${JSON.stringify((await res?.text()) ?? '')}`)

        return res != null && res.ok
    }

    export async function list({ pageIndex = 1, pageSize = 30, type = IngType.all } = {}) {
        const para = consUrlPara(['pageIndex', `${pageIndex}`], ['pageSize', `${pageSize}`])
        const header = consReqHeader(['Content-Type', 'application/json'])

        const url = `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/@${type}?${para}`

        let list: Ing[]
        try {
            const resp = await Http.get(url, header)
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
        try {
            const res = await fetch(`${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/${ingId}/comments`, {
                method: 'POST',
                headers: [['Content-Type', 'application/json']],
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                void Alert.err(`发表评论失败, ${await res.text()}`)
                return false
            }
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            void Alert.err(`发表评论失败, ${e}`)
            return false
        }

        return true
    }
}
