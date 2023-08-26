import { DownloadedBlogExport } from '@/model/blog-export'
import fs from 'fs'
import { take } from 'lodash-es'
import { LocalState } from '@/ctx/local-state'

const listKey = 'downloadExports'
const metadataKey = 'downloadedExport-'

const updateList = (value?: DownloadedBlogExport[] | null) => LocalState.setState(listKey, value)

const updateExport = (id: number, value?: DownloadedBlogExport | null) =>
    LocalState.setState(`${metadataKey}${id}`, value)

export namespace DownloadedExportStore {
    export async function add(filePath: string, id?: number | null) {
        const item: DownloadedBlogExport = { id, filePath }
        const list = await DownloadedExportStore.list()
        const oldIdx = list.findIndex(x => x.filePath === filePath)

        list.splice(oldIdx >= 0 ? oldIdx : 0, oldIdx >= 0 ? 1 : 0, item)

        return Promise.all([
            id != null && id > 0 ? updateExport(id, { id, filePath }) : Promise.resolve(),
            updateList(take(list, 5000)),
        ])
    }

    export async function list({ prune = true } = {}) {
        let items = <DownloadedBlogExport[]>LocalState.getState(listKey) ?? []

        if (prune) {
            const prunedItems: DownloadedBlogExport[] = []
            items = items.filter(x => {
                const isExist = fs.existsSync(x.filePath)
                if (!isExist) {
                    prunedItems.push(x)
                    return false
                }

                return true
            })

            if (prunedItems.length > 0) {
                const futList = [updateList(items)].concat(
                    prunedItems.map(p =>
                        p.id !== null && p.id !== undefined ? updateExport(p.id, undefined) : Promise.resolve()
                    )
                )
                await Promise.all(futList)
            }
        }

        return Promise.resolve(<DownloadedBlogExport[]>LocalState.getState(listKey) ?? [])
    }

    export async function remove(downloaded: DownloadedBlogExport, { shouldRemoveExportRecordMap = true } = {}) {
        const futList = [
            updateList((await list()).filter(x => x.filePath !== downloaded.filePath)),
            shouldRemoveExportRecordMap && downloaded.id != null && downloaded.id > 0
                ? updateExport(downloaded.id, undefined)
                : await Promise.resolve(),
        ]
        await Promise.all(futList)
    }

    export async function findById(id: number, { prune = true } = {}) {
        const key = `${metadataKey}${id}`

        let item = LocalState.getState(key) as DownloadedBlogExport | undefined

        if (prune && item !== undefined) {
            const isExist = fs.existsSync(item.filePath)
            if (!isExist) {
                item = undefined
                await updateExport(id, undefined)
            }
        }

        return item
    }
}
