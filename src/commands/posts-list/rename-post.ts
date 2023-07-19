import { escapeRegExp } from 'lodash-es'
import path from 'path'
import { MessageOptions, ProgressLocation, Uri, window, workspace } from 'vscode'
import { Post } from '@/models/post'
import { PostService } from '@/services/post.service'
import { PostFileMapManager } from '@/services/post-file-map'
import { postsDataProvider } from '@/tree-view-providers/posts-data-provider'
import { revealPostsListItem } from '@/services/posts-list-view'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'

const renameLinkedFile = async (post: Post): Promise<void> => {
    const filePath = PostFileMapManager.getFilePath(post.id)

    if (!filePath) return

    const fileUri = Uri.file(filePath)

    const options = ['是']
    const input = await window.showInformationMessage(
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
        postsDataProvider.fireTreeDataChangedEvent(post)
    }
}

export const renamePost = async (arg: Post | PostTreeItem) => {
    const post = arg instanceof PostTreeItem ? arg.post : arg
    if (!post) return

    await revealPostsListItem(post)

    const input = await window.showInputBox({
        title: '请输入新的博文标题',
        validateInput: v => (v ? undefined : '请输入一个标题'),
        value: post.title,
    })

    if (!input) return

    return window
        .withProgress(
            {
                location: ProgressLocation.Notification,
                title: '正在更新博文',
            },
            async progress => {
                progress.report({ increment: 10 })
                const editDto = await PostService.fetchPostEditDto(post.id)
                if (!editDto) return false

                progress.report({ increment: 60 })

                const editingPost = editDto.post
                editingPost.title = input
                let hasUpdated = false
                try {
                    await PostService.updatePost(editingPost)
                    post.title = input
                    postsDataProvider.fireTreeDataChangedEvent(post)
                    hasUpdated = true
                } catch (err) {
                    void window.showErrorMessage('更新博文失败', {
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
