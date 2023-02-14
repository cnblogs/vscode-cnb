import path from 'path';
import sanitize from 'sanitize-filename';
import { Post } from '../models/post';
import { globalContext } from './global-state';
import { PostFileMapManager } from './post-file-map';

type InvalidPostFileNameMap = [postId: number, invalidName: string | undefined | null];

const storageKeyPrefix = 'cnblogs-post-has-invalid-filename-';
const buildStorageKey = (postId: number) => `${storageKeyPrefix}${postId}`;

interface SanitizeResult {
    text: string;
    isSanitized: boolean;
}

class InvalidPostTitleStore {
    store(map: InvalidPostFileNameMap): Thenable<void> {
        const [postId, invalidName] = map;
        const key = buildStorageKey(postId);
        if (invalidName) return globalContext.storage.update(key, invalidName);
        else return globalContext.storage.update(key, undefined);
    }

    get(postId: number): string | undefined {
        const key = buildStorageKey(postId);
        return globalContext.storage.get<string>(key);
    }
}

const invalidPostTitleStore = new InvalidPostTitleStore();

class PostTitleSanitizer {
    static async unSanitize(post: Post): Promise<string> {
        const { id: postId } = post;
        const localFilePath = PostFileMapManager.getFilePath(postId);
        const { title: postTitle } = post;
        if (!localFilePath) return postTitle;

        const localFilename = path.basename(localFilePath, path.extname(localFilePath));
        const { text: sanitizedTitle } = await this.sanitize(post);
        if (sanitizedTitle === localFilename) return postTitle;

        // the blogger have already changed the filename after post opened in the vscode,
        // so this changed filename should be the expected post title now
        await invalidPostTitleStore.store([postId, undefined]);
        return localFilename;
    }

    static async sanitize(post: Post): Promise<SanitizeResult> {
        const sanitizedTitle = sanitize(post.title);
        const isSanitized = sanitizedTitle !== post.title;
        if (isSanitized) await invalidPostTitleStore.store([post.id, post.title]);

        return {
            text: sanitizedTitle,
            isSanitized,
        };
    }
}

export { PostTitleSanitizer };
