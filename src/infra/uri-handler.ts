import { Disposable, EventEmitter, ProviderResult, Uri, UriHandler, Event } from 'vscode'
import { openPostInVscode } from '@/cmd/post-list/open-post-in-vscode'

class ExtUriHandler implements UriHandler, Disposable {
    private _uriEventEmitter?: EventEmitter<Uri>
    private readonly _disposable: Disposable
    private _onUri?: Event<Uri>

    constructor() {
        this._disposable = Disposable.from(
            this.onUri(uri => {
                const { path } = uri
                const splits = path.split('/')
                if (splits.length >= 3 && splits[1] === 'edit-post') {
                    const postId = parseInt(splits[2])
                    if (postId > 0) openPostInVscode(postId).then(undefined, () => void 0)
                }
            })
        )
    }

    private get uriEventEmitter() {
        this._uriEventEmitter ??= new EventEmitter<Uri>()
        return this._uriEventEmitter
    }

    get onUri() {
        this._onUri ??= this.uriEventEmitter.event
        return this._onUri
    }

    handleUri(uri: Uri): ProviderResult<void> {
        this._uriEventEmitter?.fire(uri)
    }

    dispose() {
        this._disposable.dispose()
    }
}

export const extUriHandler = new ExtUriHandler()
