import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { LocalState } from '@/ctx/local-state'
import { Uri } from 'vscode'

const validatePostFileMap = (map: PostFileMap) => map[0] >= 0 && map[1] !== ''

export type PostFileMap = [postId: number, filePath: string]

const storageKey = 'postFileMaps'

function getMaps(): PostFileMap[] {
    return <PostFileMap[]>LocalState.getState(storageKey) ?? []
}

export namespace PostFileMapManager {
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
        const validFileExt = ['.md', '.html']
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

    export function getFilePath(postId: number) {
        const map = findByPostId(postId)
        if (map === undefined) return
        if (map[1] === '') return
        return map[1]
    }

    export function getPostId(filePath: string) {
        const map = findByFilePath(filePath)
        if (map === undefined) return
        return map[0]
    }
}
