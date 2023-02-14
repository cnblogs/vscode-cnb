import fetch from '@/utils/fetch-client';
import { BlogSettings, BlogSiteDto, BlogSiteExtendDto } from '../models/blog-settings';
import { globalContext } from './global-state';

export class BlogSettingsService {
    private static _instance?: BlogSettingsService;

    private _settings?: BlogSettings;

    protected constructor() {}

    static get instance() {
        if (!this._instance) this._instance = new BlogSettingsService();
        return this._instance;
    }

    async getBlogSettings(forceRefresh = false): Promise<BlogSettings> {
        if (this._settings && !forceRefresh) return this._settings;

        const url = `${globalContext.config.apiBaseUrl}/api/settings`;
        const res = await fetch(url);
        if (!res.ok) throw Error(`Failed to request ${url}, statusCode: ${res.status}, detail: ${await res.text()}`);

        const data = (await res.json()) as { blogSite: BlogSiteDto; extend: BlogSiteExtendDto };
        return new BlogSettings(data.blogSite, data.extend);
    }
}

export const blogSettingsService = BlogSettingsService.instance;
