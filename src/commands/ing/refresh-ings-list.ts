import { CmdHandler } from '@/commands/cmd-handler'
import { getIngListWebviewProvider } from 'src/services/ings-list-webview-provider'

export class RefreshIngsList extends CmdHandler {
    handle(): Promise<void> {
        return getIngListWebviewProvider().refreshIngsList()
    }
}
