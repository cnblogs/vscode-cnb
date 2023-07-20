import { globalCtx } from 'src/services/global-ctx'
import {
    CancellationToken,
    Disposable,
    Webview,
    WebviewView,
    WebviewViewProvider,
    WebviewViewResolveContext,
    window,
} from 'vscode'
import { parseWebviewHtml } from 'src/services/parse-webview-html'
import { IngWebviewHostCmd, IngWebviewUiCmd, WebviewCmd } from 'src/models/webview-cmd'
import { IngApi } from 'src/services/ing.api'
import { IngAppState } from 'src/models/ing-view'
import { IngType, IngTypesMetadata } from 'src/models/ing'
import { isNumber } from 'lodash-es'
import { CommentIngCmdHandler } from '@/commands/ing/comment-ing'
import { execCmd } from '@/utils/cmd'

export class IngsListWebviewProvider implements WebviewViewProvider {
    private static _instance: IngsListWebviewProvider | null = null

    readonly viewId = `${globalCtx.extName}.ings-list-webview`

    private readonly _baseTitle = '闪存'
    private _view: WebviewView | null = null
    private _observer: IngWebviewMessageObserver | null = null
    private _pageIndex = 1
    private _isRefreshing = false
    private _ingType = IngType.all
    private _show: WebviewView['show'] | null = null

    private constructor() {}

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

    get show() {
        this._show ??= this._view ? this._view.show.bind(this._view) : null
        return this._show
    }

    static get instance() {
        this._instance ??= new IngsListWebviewProvider()
        return this._instance
    }

    private get assetsUri() {
        return globalCtx.assetsUri
    }

    static ensureRegistered() {
        if (!this._instance) {
            this._instance = new IngsListWebviewProvider()
            globalCtx.extCtx.subscriptions.push(
                window.registerWebviewViewProvider(this._instance.viewId, this._instance)
            )
        }

        return this._instance
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        if (this._view && this._view === webviewView) return

        this._view = webviewView

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.assetsUri],
        }

        const disposables: Disposable[] = []
        webviewView.webview.onDidReceiveMessage(this.observer.observer, disposables)
        webviewView.webview.html = await this.provideHtml(webviewView.webview)
        window.onDidChangeActiveColorTheme(
            () => webviewView.webview.postMessage(WebviewCmd.UiCmd.updateTheme),
            disposables
        )
        webviewView.onDidDispose(() => {
            disposables.forEach(d => void d.dispose())
            this._view = null
            this.setIsRefreshing(false).catch(() => undefined)
        }, disposables)
    }

    async refreshIngsList({ ingType = this.ingType, pageIndex = this.pageIndex } = {}) {
        if (!this._view || !this.show) return

        if (this._view.visible) {
            if (this.isRefreshing) return
            await this.setIsRefreshing(true)

            await this._view.webview
                .postMessage({
                    payload: { isRefreshing: true },
                    command: WebviewCmd.IngCmd.UiCmd.setAppState,
                } as IngWebviewUiCmd<Partial<IngAppState>>)
                .then(undefined, () => undefined)
            const ings = await IngApi.list({
                type: ingType,
                pageIndex,
                pageSize: 30,
            })
            const comments = await IngApi.listComments(...ings.map(x => x.id))
            await this._view.webview
                .postMessage({
                    command: WebviewCmd.IngCmd.UiCmd.setAppState,
                    payload: {
                        ings,
                        isRefreshing: false,
                        comments,
                    },
                } as IngWebviewUiCmd<Omit<IngAppState, ''>>)
                .then(undefined, () => undefined)
        } else {
            this.show()
        }

        await this.setIngType(ingType)
        await this.setPageIndex(pageIndex)
        await this.setIsRefreshing(false)
        this.setTitle()
    }

    async updateComments(ingIds: number[]) {
        if (!this._view || !this._view.visible) return
        const comments = await IngApi.listComments(...ingIds)
        await this._view.webview.postMessage({
            command: WebviewCmd.IngCmd.UiCmd.setAppState,
            payload: {
                comments,
            },
        } as IngWebviewUiCmd<Omit<IngAppState, ''>>)
    }

    private provideHtml(webview: Webview) {
        return parseWebviewHtml('ing', webview)
    }

    private async setIsRefreshing(value: boolean) {
        await execCmd('setContext', `${globalCtx.extName}.ingsList.isRefreshing`, value ? true : undefined).then(
            undefined,
            () => undefined
        )
        this._isRefreshing = value
    }

    private async setPageIndex(value: number) {
        await execCmd('setContext', `${globalCtx.extName}.ingsList.pageIndex`, value > 0 ? value : undefined).then(
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
        this._view.title = `${this._baseTitle}${ingTypeSuffix ? ' - ' + ingTypeSuffix : ''}${pageIndexSuffix}`
    }
}

class IngWebviewMessageObserver {
    constructor(private _provider: IngsListWebviewProvider) {}

    observer = ({ command, payload }: IngWebviewHostCmd) => {
        switch (command) {
            case WebviewCmd.IngCmd.ExtCmd.refreshIngsList: {
                const { ingType, pageIndex } = payload
                return this._provider.refreshIngsList({
                    ingType:
                        ingType && Object.values(IngType).includes(ingType as IngType)
                            ? (ingType as IngType)
                            : undefined,
                    pageIndex: isNumber(pageIndex) ? pageIndex : undefined,
                })
            }
            case WebviewCmd.IngCmd.ExtCmd.comment: {
                const { atUser, ingId, ingContent, parentCommentId } = payload as WebviewCmd.IngCmd.CommentCmdPayload
                return new CommentIngCmdHandler(ingId, ingContent, parentCommentId, atUser).handle()
            }
        }
    }
}
