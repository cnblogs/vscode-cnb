type WebviewCommonCommand<TPayload> = import('@models/webview-commands').WebviewCommonCommand<TPayload>

declare interface VsCodeApi {
    postMessage<T extends WebviewCommonCommand<unknown> = WebviewCommonCommand<{}>>(message: Object | T): any
}

declare interface Window {
    addEventListener<TCommand extends WebviewCommonCommand<unknown>>(
        type: 'message',
        callback: (event: { data: TCommand }) => unknown
    ): void
}

declare function acquireVsCodeApi(): VsCodeApi
