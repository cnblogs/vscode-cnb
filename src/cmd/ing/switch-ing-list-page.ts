import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'

export function goIngListNextPage() {
    const provider = getIngListWebviewProvider()
    const { pageIndex } = provider
    return provider.refreshingList({ pageIndex: pageIndex + 1 })
}

export function goIngListPrevPage() {
    const provider = getIngListWebviewProvider()
    const { pageIndex } = provider
    if (pageIndex > 1) return provider.refreshingList({ pageIndex: pageIndex - 1 })
    return Promise.resolve()
}

export function goIngList1stPage(): Promise<void> {
    return getIngListWebviewProvider().refreshingList({ pageIndex: 1 })
}
