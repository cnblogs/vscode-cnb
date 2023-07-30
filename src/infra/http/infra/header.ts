export namespace ReqHeaderKey {
    export const CONTENT_TYPE = 'Content-Type'
    export const AUTHORIZATION = 'Authorization'
}

export function consReqHeader(...kvs: [string, string][]) {
    const header = new Map<string, string>()
    kvs.forEach(([k, v]) => header.set(k, v))
    return header
}
