import { AccountManager } from '@/auth/account-manager'

import { ReqHeaderKey } from '@/infra/http/infra/header'
import { bearer } from '@/infra/http/infra/auth-type'
import { Req } from '@/infra/http/req'

type Header = Map<string, string>

async function makeAuthed(header: Header) {
    const token = await AccountManager.acquireToken()
    header.set(ReqHeaderKey.AUTHORIZATION, bearer(token))

    // TODO: need better solution
    if (token.length === 64) header.set(ReqHeaderKey.AUTHORIZATION_TYPE, 'pat')
}

export namespace AuthedReq {
    export async function put(url: string, header: Header, body: string) {
        await makeAuthed(header)
        return Req.put(url, header, body)
    }

    export async function del(url: string, header: Header) {
        await makeAuthed(header)
        return Req.del(url, header)
    }

    export async function post(url: string, header: Header, body: string) {
        await makeAuthed(header)
        return Req.post(url, header, body)
    }

    export async function get(url: string, header: Header) {
        await makeAuthed(header)
        return Req.get(url, header)
    }
}
