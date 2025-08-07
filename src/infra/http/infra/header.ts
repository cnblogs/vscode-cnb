export class ReqHeaderKey {
    static CONTENT_TYPE = 'Content-Type'
    static AUTHORIZATION = 'Authorization'
    static AUTHORIZATION_TYPE = 'Authorization-Type'
}

export enum ContentType {
    appJson = 'application/json',
    appX3wfu = 'application/x-www-form-urlencoded',
}

export function consHeader(...kvs: [string, string][]) {
    const header = new Map<string, string>()
    kvs.forEach(([k, v]) => header.set(k, v))
    return header
}
