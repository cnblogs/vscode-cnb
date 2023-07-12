import { MessageOptions, ProgressLocation, Uri, window, workspace } from 'vscode'
import { Post } from '@/models/post'
import { AlertService } from '@/services/alert.service'
import { postService } from '@/services/post.service'
import { PostFileMap, PostFileMapManager } from '@/services/post-file-map'
import { postsDataProvider } from '@/tree-view-providers/posts-data-provider'
import { extensionViews } from '@/tree-view-providers/tree-view-registration'
import { refreshPostsList } from './refresh-posts-list'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'
import { postCategoriesDataProvider } from '@/tree-view-providers/post-categories-tree-data-provider'

let isDeleting = false

const confirmDelete = async (
    selectedPosts: Post[]
): Promise<{ confirmed: boolean; deleteLocalFileAtSameTime: boolean }> => {
    const result = { confirmed: false, deleteLocalFileAtSameTime: false }
    if (!selectedPosts || selectedPosts.length <= 0) return result

    const items = ['确定(保留本地文件)', '确定(同时删除本地文件)']
    const clicked = await window.showWarningMessage(
        '确定要删除吗?',
        {
            detail: `确认后将会删除 ${selectedPosts.map(x => x.title).join(', ')} 这${selectedPosts.length}篇博文吗?`,
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

export const deleteSelectedPosts = async (arg: unknown) => {
    let post: Post
    if (arg instanceof Post) post = arg
    else if (arg instanceof PostTreeItem) post = arg.post
    else return

    const selectedPosts: Post[] = post ? [post] : []
    extensionViews.visiblePostsList()?.selection.map(item => {
        const post = item instanceof PostTreeItem ? item.post : item
        if (post instanceof Post && !selectedPosts.includes(post)) {
            postsDataProvider.pagedPosts?.items.find(item => item === post)
            selectedPosts.push(post)
        }
    })
    if (selectedPosts.length <= 0) return

    if (isDeleting) {
        AlertService.warning('休息会儿再点吧~')
        return
    }

    const { confirmed: hasConfirmed, deleteLocalFileAtSameTime: isToDeleteLocalFile } = await confirmDelete(
        selectedPosts
    )
    if (!hasConfirmed) return

    isDeleting = true

    await window.withProgress({ location: ProgressLocation.Notification }, async progress => {
        progress.report({
            message: `正在删除...`,
            increment: 0,
        })
        try {
            await postService.deletePosts(selectedPosts.map(p => p.id))
            if (isToDeleteLocalFile) {
                selectedPosts
                    .map(p => PostFileMapManager.getFilePath(p.id) ?? '')
                    .filter(x => !!x)
                    .forEach(path => {
                        workspace.fs.delete(Uri.file(path)).then(undefined, ex => console.error(ex))
                    })
            }
            await PostFileMapManager.updateOrCreateMany({
                emitEvent: false,
                maps: selectedPosts.map<PostFileMap>(p => [p.id, '']),
            })
            await refreshPostsList().catch()
            postCategoriesDataProvider.onPostUpdated({
                refreshPosts: true,
                postIds: selectedPosts.map(({ id }) => id),
            })
        } catch (err) {
            void window.showErrorMessage('删除博文失败', {
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
