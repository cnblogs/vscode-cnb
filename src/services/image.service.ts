import fetch from 'node-fetch';
import { accountService } from './account.service';
import { globalState } from './global-state';
import * as FormData from 'form-data';

export class ImageService {
    private static _instance: ImageService;
    static get instance() {
        if (!this._instance) {
            this._instance = new ImageService();
        }

        return this._instance;
    }

    private constructor() {}

    async upload(file: any): Promise<string> {
        const form = new FormData();
        form.append('image', file, file.name);
        const response = await fetch(`${globalState.config.apiBaseUrl}/api/posts/body/images`, {
            method: 'POST',
            headers: [accountService.buildBearerAuthorizationHeader()],
            body: <any>form,
        });
        if (!response.ok) {
            throw Error(await response.text());
        }
        return await response.text();
    }
}

export const imageService = ImageService.instance;
