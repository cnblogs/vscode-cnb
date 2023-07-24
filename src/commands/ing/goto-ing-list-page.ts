import { CmdHandler } from '@/commands/cmd-handler'
import { getIngListWebviewProvider } from 'src/services/ing-list-webview-provider'

export class GotoingListNextPage implements CmdHandler {
    handle(): Promise<void> {
        const provider = getIngListWebviewProvider()
        const { pageIndex } = provider
        return provider.refreshingList({ pageIndex: pageIndex + 1 })
    }
}

export class GotoingListPreviousPage implements CmdHandler {
    handle(): Promise<void> {
        const provider = getIngListWebviewProvider()
        const { pageIndex } = provider
        if (pageIndex > 1) return provider.refreshingList({ pageIndex: pageIndex - 1 })
        return Promise.resolve()
    }
}

export class GotoingListFirstPage implements CmdHandler {
    handle(): Promise<void> {
        return getIngListWebviewProvider().refreshingList({ pageIndex: 1 })
    }
}
