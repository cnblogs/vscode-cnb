import { getIngListWebviewProvider } from '@/service/ing-list-webview-provider'

export const refreshIngList = () => getIngListWebviewProvider().refreshingList()
