import { IngPublishModel } from '@/models/ing';
import { accountService } from '@/services/account.service';
import { AlertService } from '@/services/alert.service';
import { globalState } from '@/services/global-state';
import fetch from 'node-fetch';

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
}
