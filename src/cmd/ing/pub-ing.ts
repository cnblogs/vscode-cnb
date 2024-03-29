import { IngType } from '@/model/ing'
import { Alert } from '@/infra/alert'
import { IngService } from '@/service/ing/ing'
import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'
import { ProgressLocation, window } from 'vscode'
import { Browser } from '@/cmd/browser'

async function afterPub(ingIsPrivate: boolean) {
    await getIngListWebviewProvider().reload({
        ingType: ingIsPrivate ? IngType.my : IngType.all,
        pageIndex: 1,
    })

    const ingSite = 'https://ing.cnblogs.com'

    const opts = [
        ['打开闪存', () => Browser.Open.open(ingSite)],
        ['我的闪存', () => Browser.Open.open(`${ingSite}/#my`)],
        ['新回应', () => Browser.Open.open(`${ingSite}/#recentcomment`)],
        ['提到我', () => Browser.Open.open(`${ingSite}/#mention`)],
    ] as const

    const selected = await Alert.info('闪存已发布, 快去看看吧', ...opts.map(opt => opt[0]))

    if (selected !== undefined) await opts.find(opt => opt[0] === selected)?.[1]()
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
