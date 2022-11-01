import fetch from 'node-fetch';
import { PostTag } from '../models/post-tag';
import { accountService } from './account.service';
import { globalState } from './global-state';

export class PostTagService {
    private static _instance: PostTagService;

    private _cachedTags?: PostTag[];

    private constructor() {}

    static get instance() {
        if (!this._instance) this._instance = new PostTagService();

        return this._instance;
    }

    async fetchTags(forceRefresh = false): Promise<PostTag[]> {
        if (this._cachedTags && !forceRefresh) return this._cachedTags;

        const response = await fetch(`${globalState.config.apiBaseUrl}/api/tags/list`, {
            method: 'GET',
            headers: [accountService.buildBearerAuthorizationHeader()],
        });
        if (!response.ok) throw Error(`获取标签失败!\n${await response.text()}`);

        const data = await response.json();
        return Array.isArray(data)
            ? data.map((x: PostTag) => Object.assign(new PostTag(), x)).filter(({ name: tagName }) => tagName)
            : [];
    }
}

export const postTagService = PostTagService.instance;
