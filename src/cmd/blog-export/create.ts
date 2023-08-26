import { Alert } from '@/infra/alert'
import { BlogExportApi } from '@/service/blog-export/blog-export'
import { BlogExportProvider } from '@/tree-view/provider/blog-export-provider'

export async function createBlogExport() {
    const answer = await Alert.info(
        '确定要创建备份吗?',
        { modal: true, detail: '一天可以创建一次备份' },
        {
            title: '确定',
            isCloseAffordance: false,
        }
    )
    if (answer === undefined) return

    try {
        await BlogExportApi.create()
        await BlogExportProvider.optionalInstance?.refreshRecords()
    } catch (e) {
        void Alert.err(`创建备份失败: ${<string>e}`)
        return false
    }
}
