import { postsDataProvider } from '../tree-view-providers/posts-data-provider';
import { globalState } from './global-state';

const validatePostFileMap = (map: PostFileMap) => map[0] >= 0 && !!map[1];

export type PostFileMap = [postId: number, filePath: string];

export class PostFileMapManager {
    static storageKey = 'postFileMaps';

    private static get maps(): PostFileMap[] {
        return globalState.storage.get<PostFileMap[]>(this.storageKey) ?? [];
    }

    static async updateOrCreateMany(...maps: PostFileMap[]): Promise<void> {
        for (const map of maps) {
            await this.updateOrCreate(map[0], map[1]);
        }
    }

    static async updateOrCreate(postId: number, filePath: string): Promise<void> {
        const validFileExt = ['.md', '.html'];
        if (filePath && !validFileExt.some(x => filePath.endsWith(x))) {
            throw Error('Invalid filepath, file must have type markdown or html');
        }
        const maps = this.maps;
        const exist = maps.find(p => p[0] === postId);
        if (exist) {
            exist[1] = filePath;
        } else {
            maps.push([postId, filePath]);
        }
        await globalState.storage.update(this.storageKey, maps.filter(validatePostFileMap));
        postsDataProvider.fireTreeDataChangedEvent(postId);
    }

    static findByPostId(postId: number) {
        const maps = this.maps.filter(validatePostFileMap);
        return maps.find(x => x[0] === postId);
    }

    static findByFilePath(path: string) {
        const maps = this.maps.filter(validatePostFileMap);
        return maps.find(x => x[0] && x[1] === path);
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
