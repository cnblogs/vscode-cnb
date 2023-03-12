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

    async add(filePath: string, id: number) {
        const item: DownloadedBlogExport = { id, filePath };
        const list = await this.list();
        list.splice(0, 0, item);

        return Promise.all([
            this._storage.update(`${this.metadataKey}${id}`, item),
            this._storage.update(this.listKey, take(list, 5000)),
        ]);
    }

    list(): Promise<DownloadedBlogExport[]> {
        return Promise.resolve(this._storage.get<DownloadedBlogExport[]>(this.listKey) ?? []);
    }
}
