import { BlogExportRecord, BlogExportRecordList } from '@/models/blog-export'
import { globalCtx } from '@/services/global-ctx'
import got from '@/utils/http-client'

const basePath = `${globalCtx.config.apiBaseUrl}/api/blogExports`
const downloadOrigin = 'https://export.cnblogs.com'

export namespace BlogExportApi {
    export async function list({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }) {
        const para = new URLSearchParams({ pageIndex: `${pageIndex ?? ''}`, pageSize: `${pageSize ?? ''}` })

        const res = await got.get<BlogExportRecordList>(`${basePath}`, {
            searchParams: para,
            responseType: 'json',
        })

        return res.body
    }

    export async function create() {
        const res = await got.post<BlogExportRecord>(`${basePath}`, { responseType: 'json' })

        return res.body
    }

    export async function del(id: number): Promise<void> {
        await got.delete(`${basePath}/${id}`).then(() => undefined)
    }

    export async function getById(id: number): Promise<BlogExportRecord> {
        const res = await got.get<BlogExportRecord>(`${basePath}/${id}`, {
            responseType: 'json',
            timeout: {
                request: 500,
            },
            retry: {
                limit: 0,
            },
        })

        return res.body
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
