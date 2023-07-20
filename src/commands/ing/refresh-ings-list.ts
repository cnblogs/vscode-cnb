import { CmdHandler } from '@/commands/cmd-handler'
import { IngsListWebviewProvider } from 'src/services/ings-list-webview-provider'

export class RefreshIngsList extends CmdHandler {
    handle(): Promise<void> {
        return IngsListWebviewProvider.ensureRegistered().refreshIngsList()
    }
}
