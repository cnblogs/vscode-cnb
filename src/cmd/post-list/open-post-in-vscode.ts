import { Uri } from 'vscode'
import { Alert } from '@/infra/alert'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { openPostFile } from './open-post-file'
import { fsUtil } from '@/infra/fs/fsUtil'
import { postPull } from './post-pull'

export async function openPostInVscode(postId: number): Promise<Uri | undefined> {
    const mappedPostFilePath = await getMappedPostFilePath(postId)

    // pull 时取消覆盖本地文件也会执行此处代码
    if (mappedPostFilePath == null) return

    if (!(await fsUtil.exists(mappedPostFilePath))) {
        void Alert.err(`博文关联的本地文件不存在，postId: ${postId}，path: ${mappedPostFilePath}`)
        return
    }

    await openPostFile(mappedPostFilePath)
    return Uri.file(mappedPostFilePath)
}

async function getMappedPostFilePath(postId: number) {
    const mappedPostFilePath = PostFileMapManager.getFilePath(postId)
    if (mappedPostFilePath != null && (await fsUtil.exists(mappedPostFilePath))) return mappedPostFilePath
    if (await postPull(postId, true, true)) return PostFileMapManager.getFilePath(postId)
}
