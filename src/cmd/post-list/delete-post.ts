import { MessageOptions, ProgressLocation, Uri, window, workspace } from 'vscode'
import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { PostFileMap, PostFileMapManager } from '@/service/post/post-file-map'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { refreshPostList } from './refresh-post-list'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

let isDeleting = false

async function confirmDelete(selectedPost: Post[]) {
    const result = { confirmed: false, deleteLocalFileAtSameTime: false }
    if (!selectedPost || selectedPost.length <= 0) return result

    const items = ['确定(保留本地文件)', '确定(同时删除本地文件)']
    const clicked = await Alert.warn(
        '确定要删除吗?',
        {
            detail: `确认后将会删除 ${selectedPost.map(x => x.title).join(', ')} 这${selectedPost.length}篇博文吗?`,
            modal: true,
        } as MessageOptions,
        ...items
    )
    switch (clicked) {
        case items[0]:
            result.confirmed = true
            break
        case items[1]:
            result.confirmed = true
            result.deleteLocalFileAtSameTime = true
            break
    }
    return result
}

export async function deleteSelectedPost(arg: unknown) {
    let post: Post
    if (arg instanceof Post) post = arg
    else if (arg instanceof PostTreeItem) post = arg.post
    else return

    const selectedPost: Post[] = post ? [post] : []
    extTreeViews.visiblePostList()?.selection.map(item => {
        const post = item instanceof PostTreeItem ? item.post : item
        if (post instanceof Post && !selectedPost.includes(post)) selectedPost.push(post)
    })
    if (selectedPost.length <= 0) return

    if (isDeleting) {
        void Alert.warn('休息会儿再点吧~')
        return
    }

    const { confirmed: hasConfirmed, deleteLocalFileAtSameTime: isToDeleteLocalFile } = await confirmDelete(
        selectedPost
    )
    if (!hasConfirmed) return

    isDeleting = true

    await window.withProgress({ location: ProgressLocation.Notification }, async progress => {
        progress.report({
            message: `正在删除...`,
            increment: 0,
        })
        try {
            await PostService.deletePost(...selectedPost.map(p => p.id))
            if (isToDeleteLocalFile) {
                selectedPost
                    .map(p => PostFileMapManager.getFilePath(p.id) ?? '')
                    .filter(x => !!x)
                    .forEach(path => {
                        workspace.fs.delete(Uri.file(path)).then(undefined, e => console.error(e))
                    })
            }
            await PostFileMapManager.updateOrCreateMany({
                emitEvent: false,
                maps: selectedPost.map<PostFileMap>(p => [p.id, '']),
            })
            await refreshPostList().catch()
            postCategoryDataProvider.onPostUpdated({
                refreshPost: true,
                postIds: selectedPost.map(({ id }) => id),
            })
        } catch (err) {
            void Alert.err('删除博文失败', {
                detail: `服务器返回了错误, ${err instanceof Error ? err.message : JSON.stringify(err)}`,
            } as MessageOptions)
        } finally {
            progress.report({
                increment: 100,
            })
        }
    })

    isDeleting = false
}
