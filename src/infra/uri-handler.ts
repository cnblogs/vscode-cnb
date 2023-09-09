import { EventEmitter, ProviderResult, Uri, UriHandler } from 'vscode'
import { openPostInVscode } from '@/cmd/post-list/open-post-in-vscode'

class ExtUriHandler implements UriHandler {
    private _evEmitter = new EventEmitter<Uri>()

    get onUri() {
        return this._evEmitter.event
    }

    reset() {
        const evEmitter = new EventEmitter<Uri>()
        evEmitter.event(uri => {
            const { path } = uri
            const splits = path.split('/')
            if (splits.length >= 3 && splits[1] === 'post.edit') {
                const postId = parseInt(splits[2])
                if (postId > 0) void openPostInVscode(postId)
            }
        })
        this._evEmitter = evEmitter
    }

    handleUri(uri: Uri): ProviderResult<void> {
        this._evEmitter.fire(uri)
    }
}

export const extUriHandler = new ExtUriHandler()
