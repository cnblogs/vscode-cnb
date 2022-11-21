import { globalState } from 'src/services/global-state';
import {
    CancellationToken,
    Webview,
    WebviewView,
    WebviewViewProvider,
    WebviewViewResolveContext,
    window,
} from 'vscode';
import { parseWebviewHtml } from 'src/services/parse-webview-html';

export class IngWebviewProvider implements WebviewViewProvider {
    private static _instance?: IngWebviewProvider;

    readonly viewId = `${globalState.extensionName}.ing-webview`;
    private _view?: WebviewView;

    private constructor() {}

    private get extensionUri() {
        return globalState.extensionContext.extensionUri;
    }

    private get assetsUri() {
        return globalState.assetsUri;
    }

    static ensureRegistered() {
        if (!this._instance) {
            this._instance = new IngWebviewProvider();
            globalState.extensionContext.subscriptions.push(
                window.registerWebviewViewProvider(this._instance.viewId, this._instance)
            );
        }

        return this._instance;
    }

    async resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.assetsUri],
        };
        webviewView.webview.html = await this.provideHtml(webviewView.webview);
    }

    private provideHtml(webview: Webview) {
        return parseWebviewHtml('ing', webview);
    }
}
