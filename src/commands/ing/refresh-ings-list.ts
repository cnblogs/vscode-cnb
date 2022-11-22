import { CommandHandler } from 'src/commands/command-handler';
import { IngWebviewProvider } from 'src/services/ing-webview-provider';

export class RefreshIngsList extends CommandHandler {
    handle(): Promise<void> {
        return IngWebviewProvider.ensureRegistered().refreshIngsList();
    }
}
