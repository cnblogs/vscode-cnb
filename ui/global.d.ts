type WebviewCommonCmd<TPayload> = import('@/model/webview-cmd').WebviewCommonCmd<TPayload>

declare type VsCodeApi = {
    postMessage<T extends WebviewCommonCmd<unknown> = WebviewCommonCmd<{}>>(message: Object | T): any
}

declare function acquireVsCodeApi(): VsCodeApi
