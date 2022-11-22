import { CommandHandler } from 'src/commands/command-handler';
import { IngsListWebviewProvider } from 'src/services/ings-list-webview-provider';

export class RefreshIngsList extends CommandHandler {
    handle(): Promise<void> {
        return IngsListWebviewProvider.ensureRegistered().refreshIngsList();
    }
}
