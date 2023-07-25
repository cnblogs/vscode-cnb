import { Ing, IngComment, IngPublishModel, IngType } from '@/model/ing'
import { Alert } from '@/service/alert'
import { globalCtx } from '@/service/global-ctx'
import fetch from '@/infra/fetch-client'
import { URLSearchParams } from 'url'
import { isArray, isObject } from 'lodash-es'

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
        const res = await fetch(
            `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/@${type}?${new URLSearchParams({
                pageIndex: `${pageIndex}`,
                pageSize: `${pageSize}`,
            }).toString()}`,
            {
                method: 'GET',
                headers: [['Content-Type', 'application/json']],
            }
        ).catch(e => void Alert.warn(JSON.stringify(e)))

        if (!res || !res.ok) {
            void Alert.err(`获取闪存列表失败, ${res?.statusText ?? ''} ${JSON.stringify((await res?.text()) ?? '')}`)
            return []
        }

        const arr = <Ing[]>await res.json()

        try {
            if (isArray(arr) && arr.every(isObject)) return arr.map(Ing.parse)
            void Alert.err('获取闪存列表失败, 无法读取响应')
        } catch (e) {
            void Alert.err(JSON.stringify(e))
        }

        return []
    }

    export async function listComments(...ingIds: number[]) {
        const tasks = ingIds.map(id =>
            fetch(`${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/${id}/comments`, {
                method: 'GET',
                headers: [['Content-Type', 'application/json']],
            }).then(
                resp =>
                    resp?.json().then(obj => [id, obj as IngComment[] | null | undefined] as const) ??
                    Promise.resolve(undefined),
                reason => void Alert.warn(JSON.stringify(reason))
            )
        )

        const results = await Promise.all(tasks)

        return results.reduce<Record<number, IngComment[]>>((p, v) => {
            if (v) p[v[0]] = (v[1] ?? []).map(IngComment.parse)
            return p
        }, {})
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
                Alert.err(`发表评论失败, ${await res.text()}`)
                return false
            }
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            Alert.err(`发表评论失败, ${e}`)
            return false
        }

        return true
    }
}
