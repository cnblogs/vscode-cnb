import { DownloadedBlogExport } from '@/model/blog-export'
import { take } from 'lodash-es'
import { LocalState } from '@/ctx/local-state'
import { fsUtil } from '@/infra/fs/fsUtil'

const listKey = 'downloadExports'
const metadataKey = 'downloadedExport-'

const updateList = (value?: DownloadedBlogExport[] | null) => LocalState.setState(listKey, value)

const updateExport = (id: number, value?: DownloadedBlogExport | null) =>
    LocalState.setState(`${metadataKey}${id}`, value)

// eslint-disable-next-line @typescript-eslint/no-namespace
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
        let items = LocalState.getState(listKey) as DownloadedBlogExport[] ?? []

        if (prune) {
            const prunedItems: DownloadedBlogExport[] = []
            items = items.filter(async x => {
                const isExist = await fsUtil.exists(x.filePath)
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

        return Promise.resolve(LocalState.getState(listKey) as DownloadedBlogExport[] ?? [])
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
            const isExist = await fsUtil.exists(item.filePath)
            if (!isExist) {
                item = undefined
                await updateExport(id, undefined)
            }
        }

        return item
    }
}
