import { BlogExportRecord, BlogExportRecordList } from '@/models/blog-export';
import { globalContext } from '@/services/global-state';
import got from '@/utils/http-client';

const basePath = `${globalContext.config.apiBaseUrl}/api/blogExports`;
const downloadOrigin = 'https://export.cnblogs.com';

export class BlogExportApi {
    list({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }): Promise<BlogExportRecordList> {
        return got
            .get<BlogExportRecordList>(`${basePath}`, {
                searchParams: new URLSearchParams({ pageIndex: `${pageIndex ?? ''}`, pageSize: `${pageSize ?? ''}` }),
                responseType: 'json',
            })
            .then(r => r.body);
    }

    create(): Promise<BlogExportRecord> {
        return got.post<BlogExportRecord>(`${basePath}`, { responseType: 'json' }).then(r => r.body);
    }

    delete(id: number): Promise<void> {
        return got.delete(`${basePath}/${id}`).then(() => undefined);
    }

    getById(id: number): Promise<BlogExportRecord> {
        return got
            .get<BlogExportRecord>(`${basePath}/${id}`, {
                responseType: 'json',
                timeout: {
                    request: 500,
                },
                retry: {
                    limit: 0,
                },
            })
            .then(x => x.body);
    }

    download(blogId: number, exportId: number) {
        return got
            .extend({
                hooks: {
                    beforeRedirect: [
                        (opt, resp) => {
                            const location = resp.headers.location;
                            if (location && location.includes('account.cnblogs.com')) throw new Error('未授权');
                        },
                    ],
                },
            })
            .stream.get(`${downloadOrigin}/api/v1/blogs/${blogId}/exports/${exportId}`, {
                throwHttpErrors: true,
                followRedirect: true,
            });
    }
}
