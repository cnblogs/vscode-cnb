import { Ing, IngComment, IngPublishModel, IngType } from '@/models/ing'
import { AlertService } from '@/services/alert.service'
import { globalCtx } from '@/services/global-ctx'
import fetch from '@/utils/fetch-client'
import { URLSearchParams } from 'url'
import { isArray, isNumber, isObject } from 'lodash-es'

export class IngApi {
    async publishIng(ing: IngPublishModel): Promise<boolean> {
        const resp = await fetch(`${globalCtx.config.cnblogsOpenApiUrl}/api/statuses`, {
            method: 'POST',
            body: JSON.stringify(ing),
            headers: [['Content-Type', 'application/json']],
        }).catch(reason => void AlertService.warn(JSON.stringify(reason)))
        if (!resp || !resp.ok)
            AlertService.err(`闪存发布失败, ${resp?.statusText ?? ''} ${JSON.stringify((await resp?.text()) ?? '')}`)

        return resp != null && resp.ok
    }

    async list({ pageIndex = 1, pageSize = 30, type = IngType.all } = {}): Promise<Ing[] | null> {
        const resp = await fetch(
            `${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/@${type}?${new URLSearchParams({
                pageIndex: `${pageIndex}`,
                pageSize: `${pageSize}`,
            }).toString()}`,
            {
                method: 'GET',
                headers: [['Content-Type', 'application/json']],
            }
        ).catch(reason => void AlertService.warn(JSON.stringify(reason)))
        if (!resp || !resp.ok) {
            AlertService.err(
                `获取闪存列表失败, ${resp?.statusText ?? ''} ${JSON.stringify((await resp?.text()) ?? '')}`
            )
            return null
        }

        return resp
            .json()
            .then(x => (isArray(x) ? (x.every(isObject) ? x.map(Ing.parse) : null) : null))
            .then(x => {
                if (x == null) throw Error('获取闪存列表失败, 无法读取响应')
                return x
            })
            .catch(reason => {
                AlertService.err(JSON.stringify(reason))
                return null
            })
    }

    listComments(ingIds: number | number[]): Promise<Record<number, IngComment[]>> {
        const arr = isNumber(ingIds) ? [ingIds] : ingIds
        return Promise.all(
            arr.map(id =>
                fetch(`${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/${id}/comments`, {
                    method: 'GET',
                    headers: [['Content-Type', 'application/json']],
                }).then(
                    resp =>
                        resp?.json().then(obj => [id, obj as IngComment[] | null | undefined] as const) ??
                        Promise.resolve(undefined),
                    reason => void AlertService.warn(JSON.stringify(reason))
                )
            )
        ).then(results =>
            results.reduce<Record<number, IngComment[]>>((p, v) => {
                if (v) p[v[0]] = (v[1] ?? []).map(IngComment.parse)
                return p
            }, {})
        )
    }

    comment(ingId: number, data: { replyTo?: number; parentCommentId?: number; content: string }) {
        return fetch(`${globalCtx.config.cnblogsOpenApiUrl}/api/statuses/${ingId}/comments`, {
            method: 'POST',
            headers: [['Content-Type', 'application/json']],
            body: JSON.stringify(data),
        })
            .then(async resp => {
                if (!resp.ok) throw Error(await resp.text())
                return resp.ok
            })
            .catch(reason => {
                AlertService.err(`发表评论失败, ${reason}`)
                return false
            })
    }
}
