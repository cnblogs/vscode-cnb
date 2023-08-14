import { globalCtx } from '@/ctx/global-ctx'
import {
    CancellationToken,
    Disposable,
    Webview as CodeWebview,
    WebviewView,
    WebviewViewProvider,
    WebviewViewResolveContext,
    window,
} from 'vscode'
import { parseWebviewHtml } from '@/service/parse-webview-html'
import { IngWebviewHostCmd, IngWebviewUiCmd, Webview } from '@/model/webview-cmd'
import { IngService } from '@/service/ing/ing'
import { IngAppState } from '@/model/ing-view'
import { IngType, IngTypesMetadata } from '@/model/ing'
import { isNumber } from 'lodash-es'
import { CommentIngCmdHandler } from '@/cmd/ing/comment-ing'
import { execCmd } from '@/infra/cmd'
import { ingStarToText } from '@/infra/convert/ing-star-to-text'
import { UiCfg } from '@/ctx/cfg/ui'

export class IngListWebviewProvider implements WebviewViewProvider {
    readonly viewId = `${globalCtx.extName}.ing-list-webview`

    private _view: WebviewView | null = null
    private _observer: IngWebviewMessageObserver | null = null
    private _pageIndex = 1
    private _isRefreshing = false
    private _ingType = IngType.all

    get observer(): IngWebviewMessageObserver {
        if (!this._view) throw Error('Cannot access the observer until the webviewView initialized!')
        this._observer ??= new IngWebviewMessageObserver(this)
        return this._observer
    }

    get pageIndex() {
        return this._pageIndex
    }

    get isRefreshing(): boolean {
        return this._isRefreshing
    }

    get ingType(): IngType {
        return this._ingType
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        if (this._view && this._view === webviewView) return

        this._view = webviewView

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [globalCtx.assetsUri],
        }

        const disposables: Disposable[] = []
        webviewView.webview.onDidReceiveMessage(this.observer.observer, disposables)
        webviewView.webview.html = await this.provideHtml(webviewView.webview)
        window.onDidChangeActiveColorTheme(
            () => webviewView.webview.postMessage(Webview.Cmd.Ui.updateTheme),
            disposables
        )
        webviewView.onDidDispose(() => {
            disposables.forEach(d => void d.dispose())
            this._view = null
            this.setIsRefreshing(false).catch(() => undefined)
        }, disposables)
    }

    async refreshingList({ ingType = this.ingType, pageIndex = this.pageIndex } = {}) {
        if (this._view == null) return

        if (this._view.visible) {
            if (this.isRefreshing) return
            await this.setIsRefreshing(true)

            await this._view.webview
                .postMessage({
                    payload: { isRefreshing: true },
                    command: Webview.Cmd.Ing.Ui.setAppState,
                } as IngWebviewUiCmd<Partial<IngAppState>>)
                .then(undefined, () => undefined)
            const rawIngList = await IngService.getList({
                type: ingType,
                pageIndex,
                pageSize: 30,
            })
            const ingList = rawIngList.map(ing => {
                if (UiCfg.isDisableIngUserAvatar()) ing.userIconUrl = ''
                if (UiCfg.isEnableTextIngStar()) ing.icons = ingStarToText(ing.icons)
                return ing
            })
            const comments = await IngService.getCommentList(...ingList.map(x => x.id))
            await this._view.webview
                .postMessage({
                    command: Webview.Cmd.Ing.Ui.setAppState,
                    payload: {
                        ingList,
                        isRefreshing: false,
                        comments,
                    },
                } as IngWebviewUiCmd<Omit<IngAppState, ''>>)
                .then(undefined, () => undefined)
        } else {
            this._view.show()
        }

        await this.setIngType(ingType)
        await this.setPageIndex(pageIndex)
        await this.setIsRefreshing(false)
        this.setTitle()
    }

    async updateComments(ingIds: number[]) {
        if (!this._view || !this._view.visible) return
        const comments = await IngService.getCommentList(...ingIds)
        await this._view.webview.postMessage({
            command: Webview.Cmd.Ing.Ui.setAppState,
            payload: {
                comments,
            },
        } as IngWebviewUiCmd<Omit<IngAppState, ''>>)
    }

    private provideHtml(webview: CodeWebview) {
        return parseWebviewHtml('ing', webview)
    }

    private async setIsRefreshing(value: boolean) {
        await execCmd('setContext', `${globalCtx.extName}.ingList.isRefreshing`, value ? true : undefined).then(
            undefined,
            () => undefined
        )
        this._isRefreshing = value
    }

    private async setPageIndex(value: number) {
        await execCmd('setContext', `${globalCtx.extName}.ingList.pageIndex`, value > 0 ? value : undefined).then(
            undefined,
            () => undefined
        )
        this._pageIndex = value
    }

    private setIngType(value: IngType) {
        this._ingType = value
        return Promise.resolve()
    }

    private setTitle() {
        if (!this._view) return
        const ingTypeSuffix = IngTypesMetadata.find(([x]) => x === this.ingType)?.[1].displayName ?? ''
        const pageIndexSuffix = this.pageIndex > 1 ? `(第${this.pageIndex}页)` : ''
        this._view.title = `闪存 ${ingTypeSuffix ? ' - ' + ingTypeSuffix : ''}${pageIndexSuffix}`
    }
}

let _ingListWebviewProvider: any = null

export function getIngListWebviewProvider(): IngListWebviewProvider {
    _ingListWebviewProvider ??= new IngListWebviewProvider()
    return <IngListWebviewProvider>_ingListWebviewProvider
}

class IngWebviewMessageObserver {
    constructor(private _provider: IngListWebviewProvider) {}

    observer = ({ command, payload }: IngWebviewHostCmd) => {
        switch (command) {
            case Webview.Cmd.Ing.Ext.refreshingList: {
                const { ingType, pageIndex } = payload
                return this._provider.refreshingList({
                    ingType:
                        ingType && Object.values(IngType).includes(ingType as IngType)
                            ? (ingType as IngType)
                            : undefined,
                    pageIndex: isNumber(pageIndex) ? pageIndex : undefined,
                })
            }
            case Webview.Cmd.Ing.Ext.comment: {
                const { atUser, ingId, ingContent, parentCommentId } = payload as Webview.Cmd.Ing.CommentCmdPayload
                return new CommentIngCmdHandler(ingId, ingContent, parentCommentId, atUser).handle()
            }
        }
    }
}
