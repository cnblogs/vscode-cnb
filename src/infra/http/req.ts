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

type Header = Map<string, string>

export namespace Req {
    export function put(url: string, body: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.put(url, body, headerJson)
    }

    export function del(url: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.del(url, headerJson)
    }

    export function post(url: string, body: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.post(url, body, headerJson)
    }

    export function get(url: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.get(url, headerJson)
    }
}
