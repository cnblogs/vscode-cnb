import { Alert } from '@/infra/alert'
import { BlogExportApi } from '@/service/blog-export'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'
import { MessageItem } from 'vscode'

export async function createBlogExport() {
    if (!(await confirm())) return

    const isOk = await BlogExportApi.create().catch((e: unknown) => {
        Alert.httpErr(typeof e === 'object' && e ? e : {}, { message: '创建博客备份失败' })
        return false
    })

    if (isOk) await BlogExportProvider.optionalInstance?.refreshRecords()
}

async function confirm() {
    const items: MessageItem[] = [{ title: '确定', isCloseAffordance: false }]
    const result = await Alert.info('确定要创建备份吗?', { modal: true, detail: '一天可以创建一次备份' }, ...items)
    return result != null
}
