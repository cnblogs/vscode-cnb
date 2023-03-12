import { BlogExportRecordList } from '@/models/blog-export';
import { BlogExportApi } from '@/services/blog-export.api';

export class BlogExportRecordsStore {
    private readonly _api = new BlogExportApi();
    private _cachedList?: Promise<BlogExportRecordList> | null;

    async refresh(
        options?: BlogExportRecordsStore['list'] extends (opt: infer U) => unknown ? U : never
    ): Promise<BlogExportRecordList> {
        if (this._cachedList) await this._cachedList.catch(() => false);

        this._cachedList = null;
        return this.list(options);
    }

    list({
        pageIndex = 1,
        pageSize = 500,
    }: {
        pageIndex?: number;
        pageSize?: number;
        shouldRefresh?: boolean;
    } = {}): Promise<BlogExportRecordList> {
        return (this._cachedList ??= this._api.list({ pageIndex, pageSize }));
    }
}
