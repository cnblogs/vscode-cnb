import path from 'path'
import sanitizeFilename from 'sanitize-filename'
import { Post } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PostFileMapManager } from './post-file-map'

type InvalidPostFileNameMap = [postId: number, invalidName: string | undefined | null]

const storageKeyPrefix = 'cnblogs-post-has-invalid-filename-'
const buildStorageKey = (postId: number) => `${storageKeyPrefix}${postId}`

interface SanitizeResult {
    text: string
    isSanitized: boolean
}

export namespace InvalidPostTitleStore {
    export function store(map: InvalidPostFileNameMap): Thenable<void> {
        const [postId, invalidName] = map
        const key = buildStorageKey(postId)
        if (invalidName) return globalCtx.storage.update(key, invalidName)
        else return globalCtx.storage.update(key, undefined)
    }

    export function get(postId: number): string | undefined {
        const key = buildStorageKey(postId)
        return globalCtx.storage.get<string>(key)
    }
}

export namespace PostTitleSanitizer {
    export async function unSanitize(post: Post): Promise<string> {
        const { id: postId } = post
        const localFilePath = PostFileMapManager.getFilePath(postId)
        const { title: postTitle } = post
        if (!localFilePath) return postTitle

        const localFilename = path.basename(localFilePath, path.extname(localFilePath))
        const { text: sanitizedTitle } = await sanitize(post)
        if (sanitizedTitle === localFilename) return postTitle

        // the blogger have already changed the filename after post opened in the vscode,
        // so this changed filename should be the expected post title now
        await InvalidPostTitleStore.store([postId, undefined])
        return localFilename
    }

    export async function sanitize(post: Post): Promise<SanitizeResult> {
        const sanitizedTitle = sanitizeFilename(post.title)
        const isSanitized = sanitizedTitle !== post.title

        if (isSanitized) await InvalidPostTitleStore.store([post.id, post.title])

        return {
            text: sanitizedTitle,
            isSanitized,
        }
    }
}
