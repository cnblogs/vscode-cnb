type WebviewCommonCmd<TPayload> = import('@models/webview-cmd').WebviewCommonCmd<TPayload>

declare interface VsCodeApi {
    postMessage<T extends WebviewCommonCmd<unknown> = WebviewCommonCmd<{}>>(message: Object | T): any
}

declare interface Window {
    addEventListener<TCmd extends WebviewCommonCmd<unknown>>(
        type: 'message',
        callback: (event: { data: TCmd }) => unknown
    ): void
}

declare function acquireVsCodeApi(): VsCodeApi
