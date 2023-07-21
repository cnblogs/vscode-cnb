import { CmdHandler } from '@/commands/cmd-handler'
import { ingListWebviewProvider } from 'src/services/ings-list-webview-provider'

export class RefreshIngsList extends CmdHandler {
    handle(): Promise<void> {
        return ingListWebviewProvider.refreshIngsList()
    }
}
