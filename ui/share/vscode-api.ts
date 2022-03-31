export namespace vsCodeApi {
    let instance: VsCodeApi | undefined;
    export const getInstance = () => {
        if (!instance) {
            instance = acquireVsCodeApi();
        }
        return instance!;
    };
}
