import { CmdHandler } from '@/commands/cmd-handler'
import { getIngListWebviewProvider } from 'src/services/ings-list-webview-provider'

export class GotoIngsListNextPage extends CmdHandler {
    handle(): Promise<void> {
        const provider = getIngListWebviewProvider()
        const { pageIndex } = provider
        return provider.refreshIngsList({ pageIndex: pageIndex + 1 })
    }
}

export class GotoIngsListPreviousPage extends CmdHandler {
    handle(): Promise<void> {
        const provider = getIngListWebviewProvider()
        const { pageIndex } = provider
        if (pageIndex > 1) return provider.refreshIngsList({ pageIndex: pageIndex - 1 })
        return Promise.resolve()
    }
}

export class GotoIngsListFirstPage extends CmdHandler {
    handle(): Promise<void> {
        return getIngListWebviewProvider().refreshIngsList({ pageIndex: 1 })
    }
}
