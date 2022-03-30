declare interface VsCodeApi {
    postMessage(message: Object): any;
}
declare function acquireVsCodeApi(): VsCodeApi;
