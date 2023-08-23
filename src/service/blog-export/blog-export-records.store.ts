import { BlogExportRecordList } from '@/model/blog-export'
import { BlogExportApi } from '@/service/blog-export/blog-export'

export namespace BlogExportRecordsStore {
    let cacheList: Promise<BlogExportRecordList> | null = null
    let cache: BlogExportRecordList | null = null

    export function getCached() {
        return cache
    }

    export async function refresh(options?: { pageIndex?: number; pageSize?: number; shouldRefresh?: boolean }) {
        await clearCache()
        return list(options)
    }

    export async function clearCache(): Promise<void> {
        if (cacheList !== null) await cacheList

        cacheList = null
        cache = null
    }

    export async function list({
        pageIndex = 1,
        pageSize = 500,
    }: {
        pageIndex?: number
        pageSize?: number
        shouldRefresh?: boolean
    } = {}): Promise<BlogExportRecordList> {
        cacheList ??= BlogExportApi.list({ pageIndex, pageSize })
        cache = await cacheList

        return cache
    }
}
