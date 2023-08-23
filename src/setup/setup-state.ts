import { setCtx } from '@/ctx/global-ctx'

export async function setupState() {
    await setCtx('post-list.isLoading', undefined)
    await setCtx('post-cat-list.isLoading', undefined)
    await setCtx('ing-list.isLoading', undefined)
    await setCtx('backup.isDownloading', undefined)
    await setCtx('backup.records.isLoading', undefined)
}
