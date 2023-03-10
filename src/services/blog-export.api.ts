import { BlogExportRecord, BlogExportRecordList } from '@/models/blog-export';
import { got } from '@/utils/http-client';

const basePath = '/api/blogExports';

export class BlogExportApi {
    list({ pageIndex, pageSize }: { pageIndex?: number; pageSize?: number }): Promise<BlogExportRecordList> {
        return got
            .get<BlogExportRecordList>(`${basePath}`, {
                searchParams: new URLSearchParams({ pageIndex: `${pageIndex ?? ''}`, pageSize: `${pageSize ?? ''}` }),
            })
            .then(r => r.body);
    }

    create(): Promise<BlogExportRecord> {
        return got.post<BlogExportRecord>(`${basePath}`).then(r => r.body);
    }

    delete(id: number): Promise<void> {
        return got.delete(`${basePath}/${id}`).then(() => undefined);
    }
}
