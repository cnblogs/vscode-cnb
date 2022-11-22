import { CommandHandler } from 'src/commands/command-handler';
import { IngsListWebviewProvider } from 'src/services/ings-list-webview-provider';

export class GotoNextIngsList extends CommandHandler {
    handle(): Promise<void> {
        const provider = IngsListWebviewProvider.ensureRegistered();
        const { pageIndex } = provider;
        return provider.refreshIngsList({ pageIndex: pageIndex + 1 });
    }
}

export class GotoPreviousIngsList extends CommandHandler {
    handle(): Promise<void> {
        const provider = IngsListWebviewProvider.ensureRegistered();
        const { pageIndex } = provider;
        if (pageIndex > 1) return provider.refreshIngsList({ pageIndex: pageIndex - 1 });
        return Promise.resolve();
    }
}
