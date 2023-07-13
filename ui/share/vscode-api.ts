export namespace vsCodeApi {
    let instance: VsCodeApi | undefined
    export const getInstance = () => (instance ??= acquireVsCodeApi())
}
