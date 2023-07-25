import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { globalCtx } from '@/ctx/global-ctx'

const validatePostFileMap = (map: PostFileMap) => map[0] >= 0 && !!map[1]

export type PostFileMap = [postId: number, filePath: string]

export class PostFileMapManager {
    static storageKey = 'postFileMaps'

    private static get maps(): PostFileMap[] {
        return globalCtx.storage.get<PostFileMap[]>(this.storageKey) ?? []
    }

    static updateOrCreateMany(maps: PostFileMap[]): Promise<void>
    static updateOrCreateMany(options: { emitEvent?: boolean; maps: PostFileMap[] }): Promise<void>
    static async updateOrCreateMany(arg: { emitEvent?: boolean; maps: PostFileMap[] } | PostFileMap[]): Promise<void> {
        let maps: PostFileMap[] = []
        let shouldEmitEvent = true
        if (Array.isArray(arg)) {
            maps = arg
        } else {
            maps = arg.maps
            shouldEmitEvent = arg.emitEvent ?? true
        }

        for (const map of maps) await this.updateOrCreate(map[0], map[1], { emitEvent: shouldEmitEvent })
    }

    static async updateOrCreate(postId: number, filePath: string, { emitEvent = true } = {}): Promise<void> {
        const validFileExt = ['.md', '.html']
        if (filePath && !validFileExt.some(x => filePath.endsWith(x)))
            throw Error('Invalid filepath, file must have type markdown or html')

        const maps = this.maps
        const exist = maps.find(p => p[0] === postId)
        if (exist) exist[1] = filePath
        else maps.push([postId, filePath])

        await globalCtx.storage.update(this.storageKey, maps.filter(validatePostFileMap))
        if (emitEvent) {
            postDataProvider.fireTreeDataChangedEvent(postId)
            postCategoryDataProvider.onPostUpdated({ refreshPost: false, postIds: [postId] })
        }
    }

    static findByPostId(postId: number) {
        const maps = this.maps.filter(validatePostFileMap)
        return maps.find(x => x[0] === postId)
    }

    static findByFilePath(path: string) {
        const maps = this.maps.filter(validatePostFileMap)
        return maps.find(x => x[0] && x[1] === path)
    }

    static getFilePath(postId: number) {
        const map = this.findByPostId(postId)
        return map ? map[1] : undefined
    }

    static getPostId(filePath: string) {
        const map = this.findByFilePath(filePath)
        return map ? map[0] : undefined
    }
}
