/* eslint-disable @typescript-eslint/naming-convention */
export type TokenInfo = {
    accessToken: string
    expiresIn?: number
    idToken?: string
    scope?: string
    tokenType?: string
}

export namespace TokenInfo {
    export function fromResp(resp: string) {
        const obj = JSON.parse(resp) as {
            access_token: string
            expires_in: number
            id_token: string
            scope: string
            token_type: string
        }
        return <TokenInfo>{
            accessToken: obj.access_token,
            expiresIn: obj.expires_in,
            idToken: obj.id_token,
            scope: obj.scope,
            tokenType: obj.token_type,
        }
    }
}
