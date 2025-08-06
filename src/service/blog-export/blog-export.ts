import { BlogExportRecord, BlogExportRecordList } from '@/model/blog-export'
import got from '@/infra/http-client'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { ExtConst } from '@/ctx/ext-const'

const basePath = `${ExtConst.ApiBase.BLOG_BACKEND}/blogExports`
const downloadOrigin = 'https://export.cnblogs.com'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BlogExportApi {
    export async function list({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }) {
        const para = consUrlPara(['pageIndex', `${pageIndex ?? ''}`], ['pageSize', `${pageSize ?? ''}`])
        const url = `${basePath}?${para}`
        const resp = await AuthedReq.get(url, consHeader())

        return JSON.parse(resp) as BlogExportRecordList
    }

    export async function create() {
        const resp = await AuthedReq.post(basePath, consHeader(), '')
        return JSON.parse(resp) as BlogExportRecord
    }

    export async function del(id: number) {
        const url = `${basePath}/${id}`
        await AuthedReq.del(url, consHeader())
    }

    export async function getById(id: number) {
        const resp = await AuthedReq.get(`${basePath}/${id}`, consHeader())
        return JSON.parse(resp) as BlogExportRecord
    }

    export function download(blogId: number, exportId: number) {
        const g = got.extend({
            hooks: {
                beforeRedirect: [
                    (_opt: any, resp: { headers: { location: any } }) => {
                        const location = resp.headers.location
                        if (location === undefined) return
                        if (location.includes('account.cnblogs.com')) throw new Error('未授权')
                    },
                ],
            },
        })

        const url = `${downloadOrigin}/blogs/${blogId}/exports/${exportId}`

        return g.stream.get(url, {
            throwHttpErrors: true,
            followRedirect: true,
        })
    }
}
