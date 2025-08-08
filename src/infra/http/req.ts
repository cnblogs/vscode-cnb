import { RsHttp } from '@/wasm'

import { mapToJson } from '@/infra/convert/map-to-json'

type Header = Map<string, string>

export class Req {
    static put(url: string, header: Header, body: string) {
        const headerJson = mapToJson(header)
        return RsHttp.put(url, headerJson, body)
    }

    static del(url: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.del(url, headerJson)
    }

    static post(url: string, header: Header, body: string) {
        const headerJson = mapToJson(header)
        return RsHttp.post(url, headerJson, body)
    }

    static get(url: string, header: Header) {
        const headerJson = mapToJson(header)
        return RsHttp.get(url, headerJson)
    }
}
