import { globalContext } from '@/services/global-state'
import { postService } from '@/services/post.service'
import vscode, { window } from 'vscode'
import { postsDataProvider } from '@/tree-view-providers/posts-data-provider'
import { AlertService } from '@/services/alert.service'
import { PostsListState } from '@/models/posts-list-state'
import { extensionViews } from '@/tree-view-providers/tree-view-registration'

let refreshTask: Promise<boolean> | null = null

export const refreshPostsList = async ({ queue = false } = {}): Promise<boolean> => {
    if (isRefreshing && !queue) {
        alertRefreshing()
        await refreshTask
        return false
    } else if (isRefreshing && refreshTask != null) {
        await refreshTask
        return refreshPostsList()
    }

    refreshTask = setRefreshing(true).then(() =>
        postsDataProvider
            .loadPosts()
            .then(pagedPosts =>
                setPostListContext(
                    pagedPosts?.pageCount ?? 0,
                    pagedPosts?.hasPrevious ?? false,
                    pagedPosts?.hasNext ?? false
                )
                    .catch()
                    .then(() => pagedPosts)
            )
            .then(pagedPosts => {
                if (pagedPosts == null) {
                    return Promise.resolve(false).finally(() => AlertService.err('刷新博文列表失败'))
                } else {
                    return postService
                        .updatePostsListState(pagedPosts)
                        .then(() => updatePostsListViewTitle())
                        .then(() => true)
                }
            })
            // TODO: impl `always` fn
            .then(ok => postsDataProvider.refreshSearch().then(() => ok))
            .then(ok => setRefreshing(false).then(() => ok))
            .catch(() => false)
            .finally(() => (refreshTask = null))
    )

    return refreshTask
}

export const gotoNextPostsList = async () => {
    await gotoPage(c => c + 1)
}

export const gotoPreviousPostsList = async () => {
    await gotoPage(c => c - 1)
}

export const seekPostsList = async () => {
    const input = await window.showInputBox({
        placeHolder: '请输入页码',
        validateInput: i => {
            const n = Number.parseInt(i)
            if (isNaN(n) || !n) return '请输入正确格式的页码'

            const state = postService.postsListState
            if (!state) return '博文列表尚未加载'

            if (isPageIndexInRange(n, state)) return undefined

            return `页码超出范围, 页码范围: 1-${state.pageCount}`
        },
    })
    const pageIndex = Number.parseInt(input ?? '-1')
    if (pageIndex > 0 && !isNaN(pageIndex)) await gotoPage(() => pageIndex)
}

let isRefreshing = false
const setRefreshing = async (value = false) => {
    const extName = globalContext.extensionName
    await vscode.commands
        .executeCommand('setContext', `${extName}.posts-list.refreshing`, value)
        .then(undefined, () => false)
    isRefreshing = value
}

const setPostListContext = async (pageCount: number, hasPrevious: boolean, hasNext: boolean) => {
    const extName = globalContext.extensionName
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.hasPrevious`, hasPrevious)
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.hasNext`, hasNext)
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.pageCount`, pageCount)
}

const alertRefreshing = () => {
    AlertService.info('正在刷新, 请勿重复操作')
}

const gotoPage = async (pageIndex: (currentIndex: number) => number) => {
    if (isRefreshing) {
        alertRefreshing()
        return
    }
    const state = postService.postsListState
    if (!state) {
        console.warn('Cannot goto previous page posts list because post list state not defined')
        return
    }
    const idx = pageIndex(state.pageIndex)
    if (!isPageIndexInRange(idx, state)) {
        console.warn(
            `Cannot goto page posts list, page index out of range, max value of page index is ${state.pageCount}`
        )
        return
    }
    state.pageIndex = idx
    await postService.updatePostsListState(state)
    await refreshPostsList()
}

const isPageIndexInRange = (pageIndex: number, state: PostsListState) => pageIndex <= state.pageCount && pageIndex >= 1

const updatePostsListViewTitle = () => {
    const state = postService.postsListState
    if (!state) return

    const { pageIndex, pageCount } = state
    const views = [extensionViews.postsList, extensionViews.anotherPostsList]
    for (const view of views) {
        let title = view.title ?? ''
        const idx = title.indexOf('(')
        const pager = `${pageIndex}/${pageCount}`
        title = idx >= 0 ? title.substring(0, idx) : title
        view.title = `${title} (${pager})`
    }
}
