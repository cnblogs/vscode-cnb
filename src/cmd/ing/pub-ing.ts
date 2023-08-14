import { execCmd } from '@/infra/cmd'
import { IngType } from '@/model/ing'
import { Alert } from '@/infra/alert'
import { globalCtx } from '@/ctx/global-ctx'
import { IngService } from '@/service/ing/ing'
import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'
import { ProgressLocation, Uri, window } from 'vscode'

async function afterPub(ingIsPrivate: boolean) {
    await getIngListWebviewProvider().refreshingList({
        ingType: ingIsPrivate ? IngType.my : IngType.all,
        pageIndex: 1,
    })

    const codeOpen = (uri: string) => execCmd('vscode.open', Uri.parse(uri))

    const options = [
        ['打开闪存', () => codeOpen(globalCtx.config.ingSite)],
        ['我的闪存', () => codeOpen(`${globalCtx.config.ingSite}/#my`)],
        ['新回应', () => codeOpen(`${globalCtx.config.ingSite}/#recentcomment`)],
        ['提到我', () => codeOpen(`${globalCtx.config.ingSite}/#mention`)],
    ] as const

    const selected = await Alert.info('闪存已发布, 快去看看吧', ...options.map(v => ({ title: v[0], id: v[0] })))

    if (selected) return options.find(x => x[0] === selected.id)?.[1]()
}

export function pubIng(content: string, isPrivate: boolean) {
    const opt = {
        location: ProgressLocation.Notification,
        title: '正在发布...',
    }

    void window.withProgress(opt, async p => {
        p.report({ increment: 40 })
        const isSuccess = await IngService.pub(content, isPrivate)
        p.report({ increment: 100 })
        if (isSuccess) void afterPub(isPrivate)
        p.report({ increment: 100 })
    })
}
