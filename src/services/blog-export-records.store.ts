import { BlogExportRecordList } from '@/models/blog-export'
import { BlogExportApi } from '@/services/blog-export.api'

export class BlogExportRecordsStore {
    private _cachedList?: Promise<BlogExportRecordList> | null
    private _cached?: BlogExportRecordList | null

    get cached() {
        return this._cached
    }

    async refresh(
        options?: BlogExportRecordsStore['list'] extends (opt: infer U) => unknown ? U : never
    ): Promise<BlogExportRecordList> {
        await this.clearCache()
        return this.list(options)
    }

    async clearCache(): Promise<void> {
        if (this._cachedList) await this._cachedList.catch(() => false)

        this._cachedList = null
        this._cached = null
    }

    async list({
        pageIndex = 1,
        pageSize = 500,
    }: {
        pageIndex?: number
        pageSize?: number
        shouldRefresh?: boolean
    } = {}): Promise<BlogExportRecordList> {
        this._cachedList ??= BlogExportApi.list({ pageIndex, pageSize })
        this._cached = await this._cachedList

        return this._cached
    }
}
