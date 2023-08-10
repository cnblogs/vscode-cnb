import { trim } from 'lodash-es'
import { AuthenticationSessionAccountInformation as ASAI } from 'vscode'
import { UserReq } from '@/wasm'
import { Alert } from '@/infra/alert'

function getAuthedUserReq(token: string) {
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new UserReq(token, isPatToken)
}

export class AccountInfo implements ASAI {
    readonly id: string
    readonly label: string

    readonly blogApp: string

    constructor(
        public readonly name: string,
        public readonly avatar: string,
        public readonly website: string, // User blog home page url
        public readonly blogId: number,
        public readonly sub: string, // User id (GUID)
        public readonly accountId: number // Space user id
    ) {
        this.id = `${this.accountId}-cnblogs`
        this.label = name
        this.blogApp = trim(this.website, '/').split('/').pop() ?? ''
    }

    get userId() {
        return this.sub
    }
}

export namespace AccountInfo {
    export function getAnonymous() {
        return new AccountInfo('anonymous', '', '', -1, '', -1)
    }

    export async function get(token: string) {
        const req = getAuthedUserReq(token)

        try {
            const resp = await req.getInfo()
            const result = <
                {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    account_id: string
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    blog_id: string
                    name: string
                    picture: string
                    sub: string
                    website: string
                }
            >JSON.parse(resp)

            return new AccountInfo(
                result.name,
                result.picture,
                result.website,
                parseInt(result.blog_id, 10),
                result.sub,
                parseInt(result.account_id, 10)
            )
        } catch (e) {
            void Alert.err(`获取用户信息失败: ${<string>e}`)
        }
    }
}
