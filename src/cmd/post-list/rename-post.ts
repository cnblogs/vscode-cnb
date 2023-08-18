import { escapeRegExp } from 'lodash-es'
import path from 'path'
import { MessageOptions, ProgressLocation, Uri, window, workspace } from 'vscode'
import { Post } from '@/model/post'
import { PostService } from '@/service/post/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { revealPostListItem } from '@/service/post/post-list-view'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { Alert } from '@/infra/alert'

async function renameLinkedFile(post: Post): Promise<void> {
    const filePath = PostFileMapManager.getFilePath(post.id)

    if (filePath === undefined) return

    const fileUri = Uri.file(filePath)

    const options = ['是']
    const input = await Alert.info(
        '重命名博文成功, 发现与博文关联的本地文件, 是否要重名本地文件',
        {
            modal: true,
        },
        ...options
    )
    if (input === options[0]) {
        const fileName = path.basename(filePath)
        const ext = path.extname(fileName)
        const newFilePath = filePath.replace(new RegExp(`${escapeRegExp(fileName)}$`), `${post.title}${ext}`)
        await workspace.fs.rename(fileUri, Uri.file(newFilePath))
        await PostFileMapManager.updateOrCreate(post.id, newFilePath)
        postDataProvider.fireTreeDataChangedEvent(post)
    }
}

export async function renamePost(arg?: Post | PostTreeItem) {
    if (arg === undefined) return

    let post: Post
    if (arg instanceof PostTreeItem) post = arg.post
    else post = arg // arg: Post

    await revealPostListItem(post)

    const input = await window.showInputBox({
        title: '请输入新的博文标题',
        validateInput: v => (v ? undefined : '请输入一个标题'),
        value: post.title,
    })

    if (input === undefined) return

    return window
        .withProgress(
            {
                location: ProgressLocation.Notification,
                title: '正在更新博文',
            },
            async progress => {
                progress.report({ increment: 10 })
                const editDto = await PostService.getPostEditDto(post.id)

                progress.report({ increment: 60 })

                const editingPost = editDto.post
                editingPost.title = input
                let hasUpdated = false
                try {
                    await PostService.update(editingPost)
                    post.title = input
                    postDataProvider.fireTreeDataChangedEvent(post)
                    hasUpdated = true
                } catch (err) {
                    void Alert.err('更新博文失败', {
                        modal: true,
                        detail: err instanceof Error ? err.message : '服务器返回异常',
                    } as MessageOptions)
                } finally {
                    progress.report({ increment: 100 })
                }

                return hasUpdated
            }
        )
        .then(x =>
            x
                ? renameLinkedFile(post).then(
                      () => x,
                      () => false
                  )
                : false
        )
}
