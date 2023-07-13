import { CommandHandler } from 'src/commands/command-handler'
import { IngsListWebviewProvider } from 'src/services/ings-list-webview-provider'

export class GotoIngsListNextPage extends CommandHandler {
    handle(): Promise<void> {
        const provider = IngsListWebviewProvider.ensureRegistered()
        const { pageIndex } = provider
        return provider.refreshIngsList({ pageIndex: pageIndex + 1 })
    }
}

export class GotoIngsListPreviousPage extends CommandHandler {
    handle(): Promise<void> {
        const provider = IngsListWebviewProvider.ensureRegistered()
        const { pageIndex } = provider
        if (pageIndex > 1) return provider.refreshIngsList({ pageIndex: pageIndex - 1 })
        return Promise.resolve()
    }
}

export class GotoIngsListFirstPage extends CommandHandler {
    handle(): Promise<void> {
        return IngsListWebviewProvider.ensureRegistered().refreshIngsList({ pageIndex: 1 })
    }
}
