class WebviewService {
    static _instance?: WebviewService;
    static get instance() {
        this._instance ??= new WebviewService();
        return this._instance;
    }

    private constructor() {}
}

const webviewService = WebviewService.instance;

export { webviewService };
