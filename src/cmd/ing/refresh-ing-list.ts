import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'

export const refreshIngList = () => getIngListWebviewProvider().refreshingList()
