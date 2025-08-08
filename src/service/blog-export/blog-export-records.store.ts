import { BlogExportRecordList } from '@/model/blog-export'
import { BlogExportApi } from '@/service/blog-export/blog-export'

export class BlogExportRecordsStore {
    private static cacheList: Promise<BlogExportRecordList> | null = null
    private static cache: BlogExportRecordList | null = null

    static getCached() {
        return BlogExportRecordsStore.cache
    }

    static async refresh(options?: { pageIndex?: number; pageSize?: number; shouldRefresh?: boolean }) {
        await BlogExportRecordsStore.clearCache()
        return BlogExportRecordsStore.list(options)
    }

    static async clearCache(): Promise<void> {
        if (BlogExportRecordsStore.cacheList !== null) await BlogExportRecordsStore.cacheList
        BlogExportRecordsStore.cacheList = null
        BlogExportRecordsStore.cache = null
    }

    static async list({
        pageIndex = 1,
        pageSize = 500,
    }: {
        pageIndex?: number
        pageSize?: number
        shouldRefresh?: boolean
    } = {}): Promise<BlogExportRecordList> {
        BlogExportRecordsStore.cacheList ??= BlogExportApi.list({ pageIndex, pageSize })
        BlogExportRecordsStore.cache = await BlogExportRecordsStore.cacheList

        return BlogExportRecordsStore.cache
    }
}
