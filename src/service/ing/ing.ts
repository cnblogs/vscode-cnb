import { Ing, IngComment, IngType } from '@/model/ing'
import { Alert } from '@/infra/alert'
import { IngReq, Token } from '@/wasm'
import { AuthManager } from '@/auth/auth-manager'

async function getAuthedIngReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new IngReq(new Token(token, isPatToken))
}

async function getComment(id: number) {
    const req = await getAuthedIngReq()
    const resp = await req.getComment(id)
    const list = JSON.parse(resp) as []
    return list.map(IngComment.parse)
}

export class IngService {
    static async pub(content: string, isPrivate: boolean) {
        try {
            const req = await getAuthedIngReq()
            await req.publish(content, isPrivate)
            return true
        } catch (e) {
            void Alert.err(`闪存发布失败: ${e as string}`)
            return false
        }
    }

    static async getList({ pageIndex = 1, pageSize = 30, type = IngType.all } = {}) {
        try {
            const req = await getAuthedIngReq()
            const resp = await req.getList(pageIndex, pageSize, type)
            const arr = JSON.parse(resp) as unknown[]
            return arr.map(Ing.parse)
        } catch (e) {
            void Alert.err(`获取闪存列表失败: ${e as string}`)
            return []
        }
    }

    static async getCommentList(...ingIds: number[]) {
        const futList = ingIds.map(async id => ({ [id]: await getComment(id) }))
        const resList = await Promise.all(futList)
        return resList.reduce((acc, it) => Object.assign(it, acc), {})
    }

    static async comment(ingId: number, content: string, replyTo?: number, parentCommentId?: number) {
        try {
            const req = await getAuthedIngReq()
            await req.comment(ingId, content, replyTo, parentCommentId)
            return true
        } catch (e) {
            void Alert.err(`发表评论失败, ${e as string}`)
            return false
        }
    }
}
