import { CmdHandler } from '@/commands/cmd-handler'
import { getIngListWebviewProvider } from 'src/services/ing-list-webview-provider'

export class RefreshingList implements CmdHandler {
    handle(): Promise<void> {
        return getIngListWebviewProvider().refreshingList()
    }
}
