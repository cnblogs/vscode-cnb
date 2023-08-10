import { AuthenticationSessionAccountInformation as ASAI } from 'vscode'
import { UserReq } from '@/wasm'
import { Alert } from '@/infra/alert'

function getAuthedUserReq(token: string) {
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new UserReq(token, isPatToken)
}

/* eslint-disable @typescript-eslint/naming-convention */
export type UserInfo = {
    UserId: string
    SpaceUserID: number
    BlogId: number
    DisplayName: string
    Face: string
    Avatar: string
    Seniority: string
    BlogApp: string
    FollowingCount: number
    FollowerCount: number
}

export class AccountInfo implements ASAI {
    readonly id: string
    readonly label: string

    constructor(public readonly userInfo: UserInfo) {
        this.id = `${userInfo.SpaceUserID}-cnblogs`
        this.label = userInfo.DisplayName
    }
}

export namespace AccountInfo {
    export async function get(token: string) {
        const req = getAuthedUserReq(token)

        try {
            const resp = await req.getInfo()
            const userInfo = <UserInfo>JSON.parse(resp)

            return new AccountInfo(userInfo)
        } catch (e) {
            void Alert.err(`获取用户信息失败: ${<string>e}`)
        }
    }
}
