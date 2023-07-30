import { BlogExportRecord, BlogExportRecordList } from '@/model/blog-export'
import { globalCtx } from '@/ctx/global-ctx'
import got from '@/infra/http-client'

const basePath = `${globalCtx.config.apiBaseUrl}/api/blogExports`
const downloadOrigin = 'https://export.cnblogs.com'

export namespace BlogExportApi {
    export async function list({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }) {
        const para = new URLSearchParams({ pageIndex: `${pageIndex ?? ''}`, pageSize: `${pageSize ?? ''}` })

        const resp = await got.get<BlogExportRecordList>(`${basePath}`, {
            searchParams: para,
            responseType: 'json',
        })

        return resp.body
    }

    export async function create() {
        const resp = await got.post<BlogExportRecord>(`${basePath}`, { responseType: 'json' })

        return resp.body
    }

    export async function del(id: number): Promise<void> {
        await got.delete(`${basePath}/${id}`).then(() => undefined)
    }

    export async function getById(id: number): Promise<BlogExportRecord> {
        const resp = await got.get<BlogExportRecord>(`${basePath}/${id}`, {
            responseType: 'json',
            timeout: {
                request: 500,
            },
            retry: {
                limit: 0,
            },
        })

        return resp.body
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
