import { DownloadedBlogExport } from '@/models/blog-export';
import { globalContext } from '@/services/global-state';
import { take } from 'lodash-es';

export class DownloadedExportStore {
    private static _instance: DownloadedExportStore;

    readonly listKey = 'downloadExports';
    readonly metadataKey = 'downloadedExport-';

    private readonly _storage = globalContext.storage;

    static get instance(): DownloadedExportStore {
        return (this._instance ??= new DownloadedExportStore());
    }

    async add(filePath: string, id?: number | null) {
        const item: DownloadedBlogExport = { id, filePath };
        const list = await this.list();
        const oldIdx = list.findIndex(x => x.filePath === filePath);

        list.splice(oldIdx >= 0 ? oldIdx : 0, oldIdx >= 0 ? 1 : 0, item);

        return Promise.all([
            id != null && id > 0
                ? this._storage.update(`${this.metadataKey}${id}`, { id, filePath })
                : Promise.resolve(),
            this._storage.update(this.listKey, take(list, 5000)),
        ]);
    }

    list(): Promise<DownloadedBlogExport[]> {
        return Promise.resolve(this._storage.get<DownloadedBlogExport[]>(this.listKey) ?? []);
    }
}
