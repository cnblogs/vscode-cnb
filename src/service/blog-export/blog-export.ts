import { BlogExportRecord, BlogExportRecordList } from '@/model/blog-export'
import got from '@/infra/http-client'
import { AuthedReq } from '@/infra/http/authed-req'
import { consHeader } from '@/infra/http/infra/header'
import { consUrlPara } from '@/infra/http/infra/url-para'
import { ExtConst } from '@/ctx/ext-const'

const basePath = `${ExtConst.ApiBase.BLOG_BACKEND}/blogExports`
const downloadOrigin = 'https://export.cnblogs.com'

export class BlogExportApi {
    static async list({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }) {
        const para = consUrlPara(['pageIndex', `${pageIndex ?? ''}`], ['pageSize', `${pageSize ?? ''}`])
        const url = `${basePath}?${para}`
        const resp = await AuthedReq.get(url, consHeader())

        return JSON.parse(resp) as BlogExportRecordList
    }

    static async create() {
        const resp = await AuthedReq.post(basePath, consHeader(), '')
        return JSON.parse(resp) as BlogExportRecord
    }

    static async del(id: number) {
        const url = `${basePath}/${id}`
        await AuthedReq.del(url, consHeader())
    }

    static async getById(id: number) {
        const resp = await AuthedReq.get(`${basePath}/${id}`, consHeader())
        return JSON.parse(resp) as BlogExportRecord
    }

    static download(blogId: number, exportId: number) {
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
