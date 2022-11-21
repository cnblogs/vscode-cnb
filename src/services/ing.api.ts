import { Ing, IngPublishModel, IngType } from '@/models/ing';
import { accountService } from '@/services/account.service';
import { AlertService } from '@/services/alert.service';
import { globalState } from '@/services/global-state';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { isArray, isObject } from 'lodash-es';

export class IngApi {
    async publishIng(ing: IngPublishModel): Promise<boolean> {
        const resp = await fetch(`${globalState.config.cnblogsOpenApiUrl}/api/statuses`, {
            method: 'POST',
            body: JSON.stringify(ing),
            headers: [accountService.buildBearerAuthorizationHeader(), ['Content-Type', 'application/json']],
        }).catch(reason => void AlertService.warning(JSON.stringify(reason)));
        if (!resp || !resp.ok)
            AlertService.error(`闪存发布失败, ${resp?.statusText ?? ''} ${JSON.stringify((await resp?.text()) ?? '')}`);

        return resp != null && resp.ok;
    }

    async list({ pageIndex = 1, pageSize = 30, type = IngType.all } = {}): Promise<Ing[] | null> {
        const resp = await fetch(
            `${globalState.config.cnblogsOpenApiUrl}/api/statuses/@${type}?${new URLSearchParams({
                pageIndex: `${pageIndex}`,
                pageSize: `${pageSize}`,
            }).toString()}`,
            {
                method: 'GET',
                headers: [accountService.buildBearerAuthorizationHeader(), ['Content-Type', 'application/json']],
            }
        ).catch(reason => void AlertService.warning(JSON.stringify(reason)));
        if (!resp || !resp.ok) {
            AlertService.error(
                `获取闪存列表失败, ${resp?.statusText ?? ''} ${JSON.stringify((await resp?.text()) ?? '')}`
            );
            return null;
        }

        return resp
            .json()
            .then(x => (isArray(x) ? (x.every(isObject) ? x.map(Ing.parse) : null) : null))
            .then(x => {
                if (x == null) throw Error('获取闪存列表失败, 无法读取响应');
                return x;
            })
            .catch(reason => {
                AlertService.error(JSON.stringify(reason));
                return null;
            });
    }
}
