import { ProviderResult, Uri, UriHandler } from 'vscode';
import { openPostInVscode } from '../commands/posts-list/open-post-in-vscode';

export class EditPostUriHandler implements UriHandler {
    handleUri(uri: Uri): ProviderResult<void> {
        const { path } = uri;
        const splits = path.split('/');
        if (splits.length >= 3 && splits[1] === 'edit-post') {
            const postId = parseInt(splits[2]);
            if (postId > 0) openPostInVscode(postId).then(undefined, () => void 0);
        }
    }
}
