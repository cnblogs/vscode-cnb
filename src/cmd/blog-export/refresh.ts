import { setCtx } from '@/ctx/global-ctx'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'

export async function refreshExportRecord() {
    await setCtx('backup.records.isRefreshing', true)

    await BlogExportProvider.instance.refreshRecords()

    await setCtx('backup.records.isRefreshing', false)
}
