import { BlogExportRecordList } from '@/models/blog-export';
import { BlogExportApi } from '@/services/blog-export.api';

export class BlogExportRecordsStore {
    private readonly _api = new BlogExportApi();
    private _cachedList?: Promise<BlogExportRecordList> | null;

    async refresh(
        options?: BlogExportRecordsStore['list'] extends (opt: infer U) => unknown ? U : never
    ): Promise<void> {
        let hasCache = false;
        if (this._cachedList) {
            await this._cachedList.catch(() => false);
            hasCache = true;
        }

        this._cachedList = null;
        return hasCache ? this.list(options).then(() => undefined) : Promise.resolve();
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
