import got from '@/utils/http-client';
import { PostTag } from '../models/post-tag';
import { globalContext } from './global-state';

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

        const {
            ok: isOk,
            url,
            method,
            body,
        } = await got.get<PostTag[]>(`${globalContext.config.apiBaseUrl}/api/tags/list`);
        if (!isOk) throw Error(`Failed to ${method} ${url}`);

        return Array.isArray(body)
            ? body.map((x: PostTag) => Object.assign(new PostTag(), x)).filter(({ name: tagName }) => tagName)
            : [];
    }
}

export const postTagService = PostTagService.instance;
