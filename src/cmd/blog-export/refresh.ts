import { setCtx } from '@/ctx/global-ctx'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'

export async function refreshExportRecord() {
    await setCtx('backup.records.isLoading', true)

    await BlogExportProvider.instance.refreshRecords()

    await setCtx('backup.records.isLoading', false)
}
