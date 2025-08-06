import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { LocalState } from '@/ctx/local-state'
import { Uri } from 'vscode'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { r } from '@/infra/convert/string-literal'
import { Post } from '@/model/post'
import sanitizeFileName from 'sanitize-filename'

const validatePostFileMap = (map: PostFileMap) => map[0] >= 0 && map[1] !== ''
export type PostFileMap = [postId: number, filePath: string]
const storageKey = 'postFileMaps'

function getMaps(): PostFileMap[] {
    return LocalState.getState(storageKey) as PostFileMap[] ?? []
}

function isUriPath(path: string) {
    return path.startsWith('/')
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PostFileMapManager {
    export function ensurePostFileUri(post: Post) {
        let fileUri = PostFileMapManager.getFileUri(post.id)
        if (fileUri == null || !isInWorkspace(fileUri.path)) fileUri = buildLocalPostFileUri(post)
        return fileUri
    }

    export function buildLocalPostFileUri(post: Post, appendToFileName = ''): Uri {
        const workspaceUri = WorkspaceCfg.getWorkspaceUri()
        const ext = `${post.isMarkdown ? 'md' : 'html'}`
        let postTitle = post.title.replace(/#/g, '＃')
        postTitle = sanitizeFileName(postTitle)
        if (/\.\d+$/.test(postTitle)) postTitle += '_'
        return Uri.joinPath(workspaceUri, `${postTitle}${appendToFileName}.${post.id}.${ext}`)
    }

    export async function updateOrCreateMany(
        arg:
            | {
                emitEvent?: boolean
                maps: PostFileMap[]
            }
            | PostFileMap[]
    ) {
        let maps: PostFileMap[] = []
        let shouldEmitEvent = true

        if (Array.isArray(arg)) {
            maps = arg
        } else {
            maps = arg.maps
            shouldEmitEvent = arg.emitEvent ?? true
        }

        for (const map of maps) await updateOrCreate(map[0], map[1], { emitEvent: shouldEmitEvent })
    }

    export async function updateOrCreate(postId: number, filePath: string, { emitEvent = true } = {}) {
        const validFileExt = ['.md', '.mkd', '.htm', '.html']
        if (filePath !== '' && !validFileExt.some(x => filePath.endsWith(x)))
            throw Error('Invalid filepath, file must have type markdown or html')

        const maps = getMaps()
        const map = maps.find(p => p[0] === postId)
        if (map !== undefined) map[1] = filePath
        else maps.push([postId, filePath])

        await LocalState.setState(storageKey, maps.filter(validatePostFileMap))
        if (emitEvent) {
            postDataProvider.fireTreeDataChangedEvent(postId)
            postCategoryDataProvider.onPostUpdated({ refreshPost: false, postIds: [postId] })
        }
    }

    export function findByPostId(postId: number) {
        const maps = getMaps().filter(validatePostFileMap)
        return maps.find(x => x[0] === postId)
    }

    export function findByFilePath(path: string) {
        const maps = getMaps().filter(validatePostFileMap)
        let map = maps.find(x => x[0] !== 0 && x[1] === path)
        if (map === undefined) map = maps.find(x => x[0] !== 0 && x[1] === Uri.parse(path).fsPath)
        return map
    }

    export function getFilePath(postId: number): string | undefined {
        return getFileUri(postId)?.fsPath
    }

    export function getFileUri(postId: number): Uri | undefined {
        const map = findByPostId(postId)
        if (map == null) return
        const path = map[1]
        if (path === '') return
        return isUriPath(path) ? Uri.parse(path) : Uri.file(path)
    }

    export function getPostId(filePath: string): number | undefined {
        const map = findByFilePath(filePath)
        if (map == null) return
        return map[0]
    }

    export function extractPostId(fileNameWithoutExt: string): number | undefined {
        const match = /\.(\d+)$/g.exec(fileNameWithoutExt)
        if (match == null) return
        return Number(match[1])
    }

    export function updateWithWorkspace(oldWorkspaceUri: Uri) {
        const newWorkspaceUri = WorkspaceCfg.getWorkspaceUri()
        if (newWorkspaceUri.path === oldWorkspaceUri.path) return
        getMaps().forEach(x => {
            const filePath = x[1]
            if (isUriPath(filePath) && filePath.indexOf(oldWorkspaceUri.path) >= 0)
                x[1] = filePath.replace(oldWorkspaceUri.path, newWorkspaceUri.path)
            else if (!isUriPath(filePath) && r`filePath`.indexOf(r`oldWorkspaceUri.fsPath`) >= 0)
                x[1] = filePath.replace(r`${oldWorkspaceUri.fsPath}`, r`${newWorkspaceUri.fsPath}`)
        })
    }

    export function isInWorkspace(fileUriPath: string) {
        return fileUriPath.indexOf(WorkspaceCfg.getWorkspaceUri().path) >= 0
    }
}
