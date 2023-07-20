import { CmdHandler } from '@/commands/cmd-handler'
import { IngsListWebviewProvider } from 'src/services/ings-list-webview-provider'

export class GotoIngsListNextPage extends CmdHandler {
    handle(): Promise<void> {
        const provider = IngsListWebviewProvider.ensureRegistered()
        const { pageIndex } = provider
        return provider.refreshIngsList({ pageIndex: pageIndex + 1 })
    }
}

export class GotoIngsListPreviousPage extends CmdHandler {
    handle(): Promise<void> {
        const provider = IngsListWebviewProvider.ensureRegistered()
        const { pageIndex } = provider
        if (pageIndex > 1) return provider.refreshIngsList({ pageIndex: pageIndex - 1 })
        return Promise.resolve()
    }
}

export class GotoIngsListFirstPage extends CmdHandler {
    handle(): Promise<void> {
        return IngsListWebviewProvider.ensureRegistered().refreshIngsList({ pageIndex: 1 })
    }
}
