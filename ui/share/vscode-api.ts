let instance: VsCodeApi | undefined

export function getVsCodeApiSingleton() {
    instance ??= acquireVsCodeApi()
    return instance
}
