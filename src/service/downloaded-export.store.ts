import { DownloadedBlogExport } from '@/model/blog-export'
import { globalCtx } from '@/ctx/global-ctx'
import { exists, existsSync } from 'fs'
import { take } from 'lodash-es'
import { promisify } from 'util'

const listKey = 'downloadExports'
const metadataKey = 'downloadedExport-'

const updateList = (value?: DownloadedBlogExport[] | null) => globalCtx.storage.update(listKey, value)

const updateExport = (id: number, value?: DownloadedBlogExport | null) =>
    globalCtx.storage.update(`${metadataKey}${id}`, value)

export namespace DownloadedExportStore {
    export async function add(filePath: string, id?: number | null): Promise<void> {
        const item: DownloadedBlogExport = { id, filePath }
        const list = await DownloadedExportStore.list()
        const oldIdx = list.findIndex(x => x.filePath === filePath)

        list.splice(oldIdx >= 0 ? oldIdx : 0, oldIdx >= 0 ? 1 : 0, item)

        return Promise.all([
            id != null && id > 0 ? updateExport(id, { id, filePath }) : Promise.resolve(),
            updateList(take(list, 5000)),
        ]).then(() => undefined)
    }

    export async function list({ prune = true } = {}): Promise<DownloadedBlogExport[]> {
        let items = globalCtx.storage.get<DownloadedBlogExport[]>(listKey) ?? []

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
                    [updateList(items)].concat(
                        prunedItems.map(p => (p.id ? updateExport(p.id, undefined) : Promise.resolve()))
                    )
                )
            }
        }

        return Promise.resolve(globalCtx.storage.get<DownloadedBlogExport[]>(listKey) ?? [])
    }

    export async function remove(downloaded: DownloadedBlogExport, { shouldRemoveExportRecordMap = true } = {}) {
        await Promise.all([
            updateList((await list()).filter(x => x.filePath !== downloaded.filePath)),
            shouldRemoveExportRecordMap && downloaded.id != null && downloaded.id > 0
                ? updateExport(downloaded.id, undefined)
                : Promise.resolve(),
        ])
    }

    export async function findById(
        id: number,
        { prune = true } = {}
    ): Promise<DownloadedBlogExport | null | undefined> {
        const key = `${metadataKey}${id}`

        let item = globalCtx.storage.get<DownloadedBlogExport>(key)

        if (prune && item) {
            const isExist = await promisify(exists)(item.filePath)
            if (!isExist) {
                item = undefined
                await updateExport(id, undefined)
            }
        }

        return item
    }
}
