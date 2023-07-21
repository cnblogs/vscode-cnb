import { CmdHandler } from '@/commands/cmd-handler'
import { getIngListWebviewProvider } from 'src/services/ing-list-webview-provider'

export class RefreshingList extends CmdHandler {
    handle(): Promise<void> {
        return getIngListWebviewProvider().refreshingList()
    }
}
