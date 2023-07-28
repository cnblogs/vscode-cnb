import { execCmd } from '@/infra/cmd'
import { globalCtx } from '@/ctx/global-ctx'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'

export async function refreshExportRecord() {
    await setIsRefreshing(true)

    await BlogExportProvider.instance.refreshRecords()

    await setIsRefreshing(false)
}

function setIsRefreshing(value: boolean) {
    return execCmd('setContext', `${globalCtx.extName}.blog-export.records.isRefreshing`, value || undefined)
}
