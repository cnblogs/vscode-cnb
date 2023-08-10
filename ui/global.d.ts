type WebviewCommonCmd<TPayload> = import('@/model/webview-cmd').WebviewCommonCmd<TPayload>

declare type VsCodeApi = {
    postMessage<T extends WebviewCommonCmd<unknown> = WebviewCommonCmd<{}>>(message: Object | T): any
}

declare type Window = {
    addEventListener<TCmd extends WebviewCommonCmd<unknown>>(
        type: 'message',
        callback: (event: { data: TCmd }) => unknown
    ): void
}

declare function acquireVsCodeApi(): VsCodeApi
