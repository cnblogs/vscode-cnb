class WebviewService {
    static _instance?: WebviewService

    private constructor() {}

    static get instance() {
        this._instance ??= new WebviewService()
        return this._instance
    }
}

const webviewService = WebviewService.instance

export { webviewService }
