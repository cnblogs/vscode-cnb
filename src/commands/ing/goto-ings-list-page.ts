import { CmdHandler } from '@/commands/cmd-handler'
import { ingListWebviewProvider } from 'src/services/ings-list-webview-provider'

export class GotoIngsListNextPage extends CmdHandler {
    handle(): Promise<void> {
        const { pageIndex } = ingListWebviewProvider
        return ingListWebviewProvider.refreshIngsList({ pageIndex: pageIndex + 1 })
    }
}

export class GotoIngsListPreviousPage extends CmdHandler {
    handle(): Promise<void> {
        const { pageIndex } = ingListWebviewProvider
        if (pageIndex > 1) return ingListWebviewProvider.refreshIngsList({ pageIndex: pageIndex - 1 })
        return Promise.resolve()
    }
}

export class GotoIngsListFirstPage extends CmdHandler {
    handle(): Promise<void> {
        return ingListWebviewProvider.refreshIngsList({ pageIndex: 1 })
    }
}
