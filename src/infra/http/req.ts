import { RsHttp } from '@/wasm'

import { mapToJson } from '@/infra/convert/map-to-json'

type Header = Map<string, string>

export namespace Req {
    export function put(url: string, header: Header, body: string) {
        const headerJson = mapToJson(header)
        return RsHttp.put(url, headerJson, body)
    }

    export function del(url: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.del(url, headerJson)
    }

    export function post(url: string, header: Header, body: string) {
        const headerJson = mapToJson(header)
        return RsHttp.post(url, headerJson, body)
    }

    export function get(url: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.get(url, headerJson)
    }
}
