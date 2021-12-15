import { postsDataProvider } from '../tree-view-providers/blog-posts-data-provider';
import { globalState } from './global-state';

export type PostFileMap = [number, string];

export class PostFileMapManager {
    static storageKey = 'postFileMaps';

    private static get maps(): PostFileMap[] {
        return globalState.storage.get<PostFileMap[]>(this.storageKey) ?? [];
    }

    static async updateOrCreate(postId: number, filePath: string) {
        const validFileExt = ['.md', '.html'];
        if (!validFileExt.some(x => filePath.endsWith(x))) {
            throw Error('Invalid filepath, file must have type markdown or html');
        }
        const maps = this.maps;
        const exist = maps.find(p => p[0] === postId);
        if (exist) {
            exist[1] = filePath;
        } else {
            maps.push([postId, filePath]);
        }
        await globalState.storage.update(this.storageKey, maps);
        const treeViewItem = postsDataProvider.pagedPosts?.items.find(x => x.id === postId);
        if (treeViewItem) {
            postsDataProvider.fireTreeDataChangedEvent(treeViewItem);
        }
    }

    static findByPostId(postId: number) {
        const maps = this.maps;
        return maps.find(x => x[0] === postId);
    }

    static findByFilePath(path: string) {
        const maps = this.maps;
        return maps.find(x => x[1] === path);
    }

    static getFilePath(postId: number) {
        const map = this.findByPostId(postId);
        return map ? map[1] : undefined;
    }

    static getPostId(filePath: string) {
        const map = this.findByFilePath(filePath);
        return map ? map[0] : undefined;
    }
}
