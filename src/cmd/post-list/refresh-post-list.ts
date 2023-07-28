import { globalCtx } from '@/ctx/global-ctx'
import { PostService } from '@/service/post'
import { window } from 'vscode'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { Alert } from '@/infra/alert'
import { PostListState } from '@/model/post-list-state'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { execCmd } from '@/infra/cmd'

let refreshTask: Promise<boolean> | null = null

export const refreshPostList = async ({ queue = false } = {}): Promise<boolean> => {
    if (isRefreshing && !queue) {
        alertRefreshing()
        await refreshTask
        return false
    } else if (isRefreshing && refreshTask != null) {
        await refreshTask
        return refreshPostList()
    }

    refreshTask = setRefreshing(true).then(() =>
        postDataProvider
            .loadPost()
            .then(pagedPost =>
                setPostListContext(
                    pagedPost?.pageCount ?? 0,
                    pagedPost?.hasPrevious ?? false,
                    pagedPost?.hasNext ?? false
                )
                    .catch()
                    .then(() => pagedPost)
            )
            .then(pagedPost => {
                if (pagedPost == null) {
                    return Promise.resolve(false).finally(() => void Alert.err('刷新博文列表失败'))
                } else {
                    return PostService.updatePostListState(pagedPost)
                        .then(() => updatePostListViewTitle())
                        .then(() => true)
                }
            })
            .then(ok => postDataProvider.refreshSearch().then(() => ok))
            .then(ok => setRefreshing(false).then(() => ok))
            .catch(() => false)
            .finally(() => (refreshTask = null))
    )

    return refreshTask
}

export const goNextPostList = () => goPage(i => i + 1)

export const goPrevPostList = () => goPage(i => i - 1)

export const seekPostList = async () => {
    const input = await window.showInputBox({
        placeHolder: '请输入页码',
        validateInput: i => {
            const n = Number.parseInt(i)
            if (isNaN(n) || !n) return '请输入正确格式的页码'

            const state = PostService.getPostListState()
            if (!state) return '博文列表尚未加载'

            if (isPageIndexInRange(n, state)) return undefined

            return `页码超出范围, 页码范围: 1-${state.pageCount}`
        },
    })
    const pageIndex = Number.parseInt(input ?? '-1')
    if (pageIndex > 0 && !isNaN(pageIndex)) await goPage(() => pageIndex)
}

let isRefreshing = false
const setRefreshing = async (value = false) => {
    const extName = globalCtx.extName
    await execCmd('setContext', `${extName}.post-list.refreshing`, value).then(undefined, () => false)
    isRefreshing = value
}

const setPostListContext = async (pageCount: number, hasPrevious: boolean, hasNext: boolean) => {
    const extName = globalCtx.extName
    await execCmd('setContext', `${extName}.post-list.hasPrevious`, hasPrevious)
    await execCmd('setContext', `${extName}.post-list.hasNext`, hasNext)
    await execCmd('setContext', `${extName}.post-list.pageCount`, pageCount)
}

const alertRefreshing = () => {
    void Alert.info('正在刷新, 请勿重复操作')
}

const goPage = async (pageIndex: (currentIndex: number) => number) => {
    if (isRefreshing) {
        alertRefreshing()
        return
    }
    const state = PostService.getPostListState()
    if (!state) {
        console.warn('Cannot goto previous page post list because post list state not defined')
        return
    }
    const idx = pageIndex(state.pageIndex)
    if (!isPageIndexInRange(idx, state)) {
        console.warn(
            `Cannot goto page post list, page index out of range, max value of page index is ${state.pageCount}`
        )
        return
    }
    state.pageIndex = idx
    await PostService.updatePostListState(state)
    await refreshPostList()
}

const isPageIndexInRange = (pageIndex: number, state: PostListState) => pageIndex <= state.pageCount && pageIndex >= 1

const updatePostListViewTitle = () => {
    const state = PostService.getPostListState()
    if (!state) return

    const { pageIndex, pageCount } = state
    const views = [extTreeViews.postList, extTreeViews.anotherPostList]
    for (const view of views) {
        let title = view.title ?? ''
        const idx = title.indexOf('(')
        const pager = `${pageIndex}/${pageCount}`
        title = idx >= 0 ? title.substring(0, idx) : title
        view.title = `${title} (${pager})`
    }
}
