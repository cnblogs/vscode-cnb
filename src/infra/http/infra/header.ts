// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReqHeaderKey {
    export const CONTENT_TYPE = 'Content-Type'
    export const AUTHORIZATION = 'Authorization'
    export const AUTHORIZATION_TYPE = 'Authorization-Type'

    export enum ContentType {
        appJson = 'application/json',
        appX3wfu = 'application/x-www-form-urlencoded',
    }
}

export function consHeader(...kvs: [string, string][]) {
    const header = new Map<string, string>()
    kvs.forEach(([k, v]) => header.set(k, v))
    return header
}
