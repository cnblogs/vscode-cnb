import { PostService } from '@/service/post/post'
import { Alert } from '@/infra/alert'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { existsSync } from 'fs'
import { basename } from 'path'
import { ProgressLocation, Uri, window, workspace } from 'vscode'
import { buildLocalPostFileUri } from '@/cmd/post-list/open-post-in-vscode'
import { accountManager } from '@/auth/account-manager'

enum ConflictStrategy {
    ask,
    skip,
    overwrite,
}

async function overwriteFile(path: string, text: string) {
    const uri = Uri.file(path)
    const buf = Buffer.from(text)
    await workspace.fs.delete(uri, { useTrash: true })
    await workspace.fs.writeFile(uri, buf)
}

// 单次累计随笔请求上限
const MAX_POST_LIMIT = 1000
// 单次累计随笔字节上限
const MAX_BYTE_LIMIT = MAX_POST_LIMIT * 10000

export async function postPullAll() {
    const isVip = accountManager.currentUser?.userInfo.IsVip ?? false
    if (!isVip) {
        void Alert.info('下载随笔: 您是普通用户, 此功能目前仅面向 [VIP](https://cnblogs.vip/) 用户开放')
        return
    }

    let strategy = ConflictStrategy.ask

    const opt = {
        title: '下载随笔',
        location: ProgressLocation.Notification,
    }

    let byteCount = 0
    let postCount = 0

    await window.withProgress(opt, async p => {
        for await (const post of PostService.allPostIter()) {
            byteCount += Buffer.byteLength(post.postBody, 'utf-8')
            postCount += 1
            if (postCount > MAX_POST_LIMIT || byteCount > MAX_BYTE_LIMIT) {
                void Alert.info('下载随笔: 已达到单次请求限制, 无法下载更多随笔')
                return
            }

            p.report({ message: `${post.title}` })

            const path = PostFileMapManager.getFilePath(post.id)

            // 本地没有博文或关联到的文件不存在
            if (path === undefined || !existsSync(path)) {
                const uri = await buildLocalPostFileUri(post, false)
                const buf = Buffer.from(post.postBody)
                await workspace.fs.writeFile(uri, buf)
                await PostFileMapManager.updateOrCreate(post.id, uri.path)
                continue
            }

            const fileName = basename(path)

            // 存在冲突
            if (strategy === ConflictStrategy.ask) {
                const answer = await Alert.warn(
                    `拉取博文"${post.title}"时存在冲突: 已存在本地文件 ${fileName}`,
                    ...['跳过', '跳过所有冲突', '覆盖', '覆盖全部', '退出']
                )

                if (answer === '覆盖') {
                    await overwriteFile(path, post.postBody)
                } else if (answer === '退出') {
                    break
                } else if (answer === '跳过所有冲突') {
                    strategy = ConflictStrategy.skip
                } else if (answer === '覆盖全部') {
                    strategy = ConflictStrategy.overwrite
                    await overwriteFile(path, post.postBody)
                } // answer eq undefined or '跳过', do nothing.
            } else if (strategy === ConflictStrategy.overwrite) {
                await overwriteFile(path, post.postBody)
            } // strategy eq ConflictStrategy.skip, do nothing.
        }

        void Alert.info('下载随笔: 操作完成')
    })
}
