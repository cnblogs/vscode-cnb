import { PostService } from '@/service/post/post'
import { Alert } from '@/infra/alert'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { existsSync } from 'fs'
import { basename } from 'path'
import { ProgressLocation, Uri, window, workspace } from 'vscode'
import { buildLocalPostFileUri } from '@/cmd/post-list/open-post-in-vscode'

export async function postPullAll() {
    const loc = ProgressLocation.Notification

    await window.withProgress({ title: '下载随笔', location: loc }, async p => {
        for await (const post of PostService.allPostIter()) {
            p.report({ message: `正在下载: ${post.title}` })

            const path = PostFileMapManager.getFilePath(post.id)

            // 本地没有博文或关联到的文件不存在
            if (path === undefined || !existsSync(path)) {
                const uri = await buildLocalPostFileUri(post, false)
                await workspace.fs.writeFile(uri, Buffer.from(post.postBody))
                await PostFileMapManager.updateOrCreate(post.id, uri.path)
                continue
            }

            const fileName = basename(path)

            // 存在冲突
            const answer = await Alert.warn(
                `拉取博文"${post.title}"时存在冲突: 已存在本地文件 ${fileName}`,
                ...['跳过此操作', '覆盖本地文件', '退出']
            )
            if (answer === undefined) continue
            if (answer === '跳过此操作') continue
            if (answer === '退出') return

            await workspace.fs.writeFile(Uri.parse(path), Buffer.from(post.postBody))
        }
    })

    void Alert.info('下载随笔: 操作完成')
}
