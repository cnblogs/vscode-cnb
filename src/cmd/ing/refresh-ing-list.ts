import { CmdHandler } from '@/cmd/cmd-handler'
import { getIngListWebviewProvider } from '@/service/ing-list-webview-provider'

export class RefreshingList implements CmdHandler {
    handle(): Promise<void> {
        return getIngListWebviewProvider().refreshingList()
    }
}
