import path from 'path'
import sanitizeFilename from 'sanitize-filename'
import { Post } from '@/model/post'
import { PostFileMapManager } from './post-file-map'
import { LocalState } from '@/ctx/local-state'

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
        if (invalidName === undefined || invalidName == null) return LocalState.setState(key, invalidName)
        else return LocalState.setState(key, undefined)
    }

    export function get(postId: number): string | undefined {
        const key = buildStorageKey(postId)
        return <string>LocalState.getState(key)
    }
}

export namespace PostTitleSanitizer {
    export async function unSanitize(post: Post): Promise<string> {
        const { id: postId } = post
        const localFilePath = PostFileMapManager.getFilePath(postId)
        const { title: postTitle } = post
        if (localFilePath === undefined) return postTitle

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
