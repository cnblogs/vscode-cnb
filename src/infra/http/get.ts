import { accountManager } from '@/auth/account-manager'
import { RsHttp } from '@/wasm'

import fetch, { Headers, Request, Response } from 'node-fetch'
import { mapToJson } from '@/infra/convert/mapToJson'

/* eslint-disable */
// @ts-ignore
global.fetch = fetch
// @ts-ignore
global.Headers = Headers
// @ts-ignore
global.Request = Request
// @ts-ignore
global.Response = Response
/* eslint-disable */

export namespace Http {
    export async function noAuthGet(url: string, header: Map<string, string>) {
        const headerJson = mapToJson(header)
        return await RsHttp.get(url, headerJson)
    }

    export async function get(url: string, header: Map<string, string>) {
        const token = await accountManager.acquireToken()
        header.set('Authorization', `Bearer ${token}`)

        return noAuthGet(url, header)
    }
}
