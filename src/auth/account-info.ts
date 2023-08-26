import { AuthenticationSessionAccountInformation as ASAI } from 'vscode'
import { UserInfo, UserReq } from '@/wasm'
import { Alert } from '@/infra/alert'

function getAuthedUserReq(token: string) {
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new UserReq(token, isPatToken)
}

export class AccountInfo implements ASAI {
    readonly id: string
    readonly label: string

    constructor(public readonly userInfo: UserInfo) {
        this.id = `${userInfo.space_user_id}-cnblogs`
        this.label = userInfo.display_name
    }
}

export namespace AccountInfo {
    export async function get(token: string) {
        const req = getAuthedUserReq(token)

        try {
            const userInfo = await req.getInfo()

            return new AccountInfo(userInfo)
        } catch (e) {
            void Alert.err(`获取用户信息失败: ${<string>e}`)
        }
    }
}
