let instance: VsCodeApi | null = null

export function getVsCodeApiSingleton() {
    instance ??= acquireVsCodeApi()
    return instance
}
