import { BlogExportRecord, BlogExportRecordList } from '@/model/blog-export'
import { globalCtx } from '@/ctx/global-ctx'
import got from '@/infra/http-client'
import { AuthedReq } from '@/infra/http/authed-req'
import { consReqHeader } from '@/infra/http/infra/header'
import { consUrlPara } from '@/infra/http/infra/url'

const basePath = `${globalCtx.config.apiBaseUrl}/api/blogExports`
const downloadOrigin = 'https://export.cnblogs.com'

export namespace BlogExportApi {
    export async function list({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }) {
        const para = consUrlPara(['pageIndex', `${pageIndex ?? ''}`], ['pageSize', `${pageSize ?? ''}`])
        const url = `${basePath}?${para}`
        const resp = await AuthedReq.get(url, consReqHeader())

        return <BlogExportRecordList>JSON.parse(resp)
    }

    export async function create() {
        const resp = await AuthedReq.post(basePath, consReqHeader(), '')

        return <BlogExportRecord>JSON.parse(resp)
    }

    export async function del(id: number): Promise<void> {
        const url = `${basePath}/${id}`
        await AuthedReq.del(url, consReqHeader())
    }

    export async function getById(id: number) {
        const resp = await AuthedReq.get(`${basePath}/${id}`, consReqHeader())

        return <BlogExportRecord>JSON.parse(resp)
    }

    export function download(blogId: number, exportId: number) {
        const g = got.extend({
            hooks: {
                beforeRedirect: [
                    (opt, resp) => {
                        const location = resp.headers.location
                        if (location && location.includes('account.cnblogs.com')) throw new Error('未授权')
                    },
                ],
            },
        })

        return g.stream.get(`${downloadOrigin}/blogs/${blogId}/exports/${exportId}`, {
            throwHttpErrors: true,
            followRedirect: true,
        })
    }
}
