import fetch from 'node-fetch';
import { SiteCategories, SiteCategory } from '../models/site-category';
import { accountService } from './account.service';
import { globalState } from './global-state';

export namespace siteCategoryService {
    let cached: SiteCategories | undefined;

    export const fetchAll = async (forceRefresh = false): Promise<SiteCategories> => {
        if (cached && !forceRefresh) {
            return cached;
        }

        const response = await fetch(`${globalState.config.apiBaseUrl}/api/category/site`, {
            headers: [accountService.buildBearerAuthorizationHeader()],
        });
        if (!response.ok) {
            throw Error(`Failed to fetch post categories\n${response.status}\n${await response.text()}`);
        }
        const categories = <SiteCategories>await response.json();
        cached = categories.map(c => Object.assign(new SiteCategory(), c));
        return categories;
    };
}
