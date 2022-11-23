declare interface VsCodeApi {
    postMessage<T extends Record<string, unknown>>(
        message: Object | import('@models/webview-commands').IngWebviewHostCommand<T>
    ): any;
}

declare function acquireVsCodeApi(): VsCodeApi;
