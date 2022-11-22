import { globalState } from 'src/services/global-state';
import {
    CancellationToken,
    commands,
    Disposable,
    Webview,
    WebviewView,
    WebviewViewProvider,
    WebviewViewResolveContext,
    window,
} from 'vscode';
import { parseWebviewHtml } from 'src/services/parse-webview-html';
import { IngWebviewHostCommand, IngWebviewUiCommand, webviewCommands } from 'src/models/webview-commands';
import { IngApi } from 'src/services/ing.api';
import { IngAppState } from 'src/models/ing-view';
import { IngType, IngTypesMetadata } from 'src/models/ing';
import { isNumber } from 'lodash-es';

export class IngsListWebviewProvider implements WebviewViewProvider {
    private static _instance?: IngsListWebviewProvider;

    readonly viewId = `${globalState.extensionName}.ings-list-webview`;

    private readonly _baseTitle = '闪存';
    private _view?: WebviewView;
    private _observer?: IngWebviewMessageObserver;
    private _ingApi?: IngApi;
    private _pageIndex = 1;
    private _isRefreshing = false;
    private _ingType = IngType.all;
    private _show?: WebviewView['show'];

    private constructor() {}

    get observer(): IngWebviewMessageObserver {
        if (!this._view) throw Error('Cannot access the observer until the webviewView initialized!');
        return (this._observer ??= new IngWebviewMessageObserver(this));
    }

    get pageIndex() {
        return this._pageIndex;
    }

    get isRefreshing(): boolean {
        return this._isRefreshing;
    }

    get ingType(): IngType {
        return this._ingType;
    }

    get show() {
        return (this._show ??= this._view ? this._view.show.bind(this._view) : undefined);
    }

    static get instance(): IngsListWebviewProvider | undefined {
        return this._instance;
    }

    private get assetsUri() {
        return globalState.assetsUri;
    }

    private get ingApi() {
        return (this._ingApi ??= new IngApi());
    }

    static ensureRegistered() {
        if (!this._instance) {
            this._instance = new IngsListWebviewProvider();
            globalState.extensionContext.subscriptions.push(
                window.registerWebviewViewProvider(this._instance.viewId, this._instance)
            );
        }

        return this._instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        if (this._view) return;

        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.assetsUri],
        };
        const disposables: Disposable[] = [];
        webviewView.webview.onDidReceiveMessage(this.observer.observer, disposables);
        webviewView.webview.html = await this.provideHtml(webviewView.webview);
        window.onDidChangeActiveColorTheme(
            () => webviewView.webview.postMessage(webviewCommands.UiCommands.updateTheme),
            disposables
        );
        webviewView.onDidDispose(() => disposables.forEach(d => void d.dispose()), disposables);
    }

    async refreshIngsList({ ingType = this.ingType, pageIndex = this.pageIndex } = {}) {
        if (!this._view || !this.show) return;

        if (this._view.visible) {
            if (this.isRefreshing) return;
            await this.setIsRefreshing(true);

            await this._view.webview
                .postMessage({
                    payload: { isRefreshing: true },
                    command: webviewCommands.ingCommands.UiCommands.setAppState,
                } as IngWebviewUiCommand<Partial<IngAppState>>)
                .then(undefined, () => undefined);
            const ings = await this.ingApi.list({
                type: ingType,
                pageIndex,
                pageSize: 30,
            });
            const comments = await this.ingApi.listComments(ings?.map(x => x.id) ?? []);
            await this._view.webview
                .postMessage({
                    command: webviewCommands.ingCommands.UiCommands.setAppState,
                    payload: {
                        ings,
                        isRefreshing: false,
                        comments,
                    },
                } as IngWebviewUiCommand<Omit<IngAppState, ''>>)
                .then(undefined, () => undefined);
        } else {
            this.show();
        }

        await this.setIngType(ingType);
        await this.setPageIndex(pageIndex);
        await this.setIsRefreshing(false);
        this.setTitle();
    }

    private provideHtml(webview: Webview) {
        return parseWebviewHtml('ing', webview);
    }

    private async setIsRefreshing(value: boolean) {
        await commands
            .executeCommand(
                'setContext',
                `${globalState.extensionName}.ingsList.isRefreshing`,
                value ? true : undefined
            )
            .then(undefined, () => undefined);
        this._isRefreshing = value;
    }

    private async setPageIndex(value: number) {
        await commands
            .executeCommand(
                'setContext',
                `${globalState.extensionName}.ingsList.pageIndex`,
                value > 0 ? value : undefined
            )
            .then(undefined, () => undefined);
        this._pageIndex = value;
    }

    private setIngType(value: IngType) {
        this._ingType = value;
        return Promise.resolve();
    }

    private setTitle() {
        if (!this._view) return;
        const ingTypeSuffix = IngTypesMetadata.find(([x]) => x === this.ingType)?.[1].displayName ?? '';
        const pageIndexSuffix = this.pageIndex > 1 ? `(第${this.pageIndex}页)` : '';
        this._view.title = `${this._baseTitle}${ingTypeSuffix ? ' - ' + ingTypeSuffix : ''}${pageIndexSuffix}`;
    }
}

class IngWebviewMessageObserver {
    constructor(private _provider: IngsListWebviewProvider) {}

    observer = ({ command, payload }: IngWebviewHostCommand) => {
        switch (command) {
            case webviewCommands.ingCommands.ExtensionCommands.refreshIngsList: {
                const { ingType, pageIndex } = payload;
                return this._provider.refreshIngsList({
                    ingType:
                        ingType && Object.values(IngType).includes(ingType as IngType)
                            ? (ingType as IngType)
                            : undefined,
                    pageIndex: isNumber(pageIndex) ? pageIndex : undefined,
                });
            }
        }
    };
}
