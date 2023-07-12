import { DownloadedBlogExport } from '@/models/blog-export'
import { globalContext } from '@/services/global-state'
import { exists, existsSync } from 'fs'
import { take } from 'lodash-es'
import { promisify } from 'util'

export class DownloadedExportStore {
    private static _instance: DownloadedExportStore

    readonly listKey = 'downloadExports'
    readonly metadataKey = 'downloadedExport-'

    private readonly _storage = globalContext.storage

    static get instance(): DownloadedExportStore {
        return (this._instance ??= new DownloadedExportStore())
    }

    async add(filePath: string, id?: number | null): Promise<void> {
        const item: DownloadedBlogExport = { id, filePath }
        const list = await this.list()
        const oldIdx = list.findIndex(x => x.filePath === filePath)

        list.splice(oldIdx >= 0 ? oldIdx : 0, oldIdx >= 0 ? 1 : 0, item)

        return Promise.all([
            id != null && id > 0 ? this.updateExport(id, { id, filePath }) : Promise.resolve(),
            this.updateList(take(list, 5000)),
        ]).then(() => undefined)
    }

    async list({ prune = true } = {}): Promise<DownloadedBlogExport[]> {
        let items = this._storage.get<DownloadedBlogExport[]>(this.listKey) ?? []
        if (prune) {
            const prunedItems: DownloadedBlogExport[] = []
            items = items.filter(x => {
                const isExist = existsSync(x.filePath)
                if (!isExist) {
                    prunedItems.push(x)
                    return false
                }

                return true
            })

            if (prunedItems.length > 0) {
                await Promise.all(
                    [this.updateList(items)].concat(
                        prunedItems.map(p => (p.id ? this.updateExport(p.id, undefined) : Promise.resolve()))
                    )
                )
            }
        }

        return Promise.resolve(this._storage.get<DownloadedBlogExport[]>(this.listKey) ?? [])
    }

    async remove(downloaded: DownloadedBlogExport, { shouldRemoveExportRecordMap = true } = {}) {
        await Promise.all([
            this.updateList((await this.list()).filter(x => x.filePath !== downloaded.filePath)),
            shouldRemoveExportRecordMap && downloaded.id != null && downloaded.id > 0
                ? this.updateExport(downloaded.id, undefined)
                : Promise.resolve(),
        ])
    }

    async findById(id: number, { prune = true } = {}): Promise<DownloadedBlogExport | null | undefined> {
        const key = `${this.metadataKey}${id}`
        let item = this._storage.get<DownloadedBlogExport>(key)
        if (prune && item) {
            const isExist = await promisify(exists)(item.filePath)
            if (!isExist) {
                item = undefined
                await this.updateExport(id, undefined)
            }
        }

        return item
    }

    private updateList(value?: DownloadedBlogExport[] | null) {
        return this._storage.update(this.listKey, value)
    }

    private updateExport(id: number, value?: DownloadedBlogExport | null) {
        return this._storage.update(`${this.metadataKey}${id}`, value)
    }
}
