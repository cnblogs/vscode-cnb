import { accountManager } from '@/auth/account-manager'

import { ReqHeaderKey } from '@/infra/http/infra/header'
import { bearer } from '@/infra/http/infra/bearer'
import { Req } from '@/infra/http/req'

export namespace AuthedReq {
    export async function put(url: string, body: string, header: Map<string, string>) {
        const token = await accountManager.acquireToken()
        header.set(ReqHeaderKey.AUTHORIZATION, bearer(token))

        return Req.put(url, body, header)
    }

    export async function del(url: string, header: Map<string, string>) {
        const token = await accountManager.acquireToken()
        header.set(ReqHeaderKey.AUTHORIZATION, bearer(token))

        return Req.del(url, header)
    }

    export async function post(url: string, body: string, header: Map<string, string>) {
        const token = await accountManager.acquireToken()
        header.set(ReqHeaderKey.AUTHORIZATION, bearer(token))

        return Req.post(url, body, header)
    }

    export async function get(url: string, header: Map<string, string>) {
        const token = await accountManager.acquireToken()
        header.set(ReqHeaderKey.AUTHORIZATION, bearer(token))

        return Req.get(url, header)
    }
}
