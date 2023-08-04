import { globalCtx } from '@/ctx/global-ctx'
import { PostService } from '@/service/post/post'
import { window } from 'vscode'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { Alert } from '@/infra/alert'
import { PostListState } from '@/model/post-list-state'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { execCmd } from '@/infra/cmd'
import { PageList } from '@/model/page'

let refreshTask: Promise<boolean> | null = null

export async function refreshPostList({ queue = false } = {}): Promise<boolean> {
    if (isRefreshing && !queue) {
        await refreshTask
        return false
    } else if (isRefreshing && refreshTask != null) {
        await refreshTask
        return refreshPostList()
    }

    const fut = async () => {
        await setRefreshing(true)
        const data = await postDataProvider.loadPost()
        const pageIndex = data.page.index
        const pageCount = data.pageCount
        const pageCap = data.page.cap
        const pageItemsCount = data.page.items.length
        const hasPrev = PageList.hasPrev(pageIndex)
        const hasNext = PageList.hasNext(pageIndex, pageCount)

        await setPostListContext(pageCount, hasPrev, hasNext)
        await PostService.updatePostListStateNg(pageIndex, pageCap, pageItemsCount, pageCount)
        updatePostListViewTitle()
        await postDataProvider.refreshSearch()
        await setRefreshing(false)
    }

    refreshTask = fut()
        .then(() => true)
        .catch(() => {
            void Alert.err('刷新博文列表失败')
            return false
        })
        .finally(() => (refreshTask = null))

    return refreshTask
}

export const goNextPostList = () => goPage(i => i + 1)

export const goPrevPostList = () => goPage(i => i - 1)

export async function seekPostList() {
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

async function setRefreshing(value = false) {
    const extName = globalCtx.extName
    await execCmd('setContext', `${extName}.post-list.refreshing`, value).then(undefined, () => false)
    isRefreshing = value
}

async function setPostListContext(pageCount: number, hasPrev: boolean, hasNext: boolean) {
    const extName = globalCtx.extName
    await execCmd('setContext', `${extName}.post-list.hasPrev`, hasPrev)
    await execCmd('setContext', `${extName}.post-list.hasNext`, hasNext)
    await execCmd('setContext', `${extName}.post-list.pageCount`, pageCount)
}

async function goPage(f: (currentIndex: number) => number) {
    if (isRefreshing) return

    const state = PostService.getPostListState()
    if (state === undefined) {
        void Alert.warn('操作失败: 状态错误')
        return
    }

    const index = f(state.pageIndex)
    if (!isPageIndexInRange(index, state)) {
        void Alert.warn(`操作失败: 已达到最大页数`)
        return
    }

    await PostService.updatePostListStateNg(index, state.pageCap, state.pageItemCount, state.pageCount)
    await refreshPostList()
}

const isPageIndexInRange = (pageIndex: number, state: PostListState) => pageIndex <= state.pageCount && pageIndex >= 1

const updatePostListViewTitle = () => {
    const state = PostService.getPostListState()
    if (state === undefined) return

    const views = [extTreeViews.postList, extTreeViews.anotherPostList]
    for (const view of views) {
        let title = view.title ?? ''
        const idx = title.indexOf('(')
        const pager = `${state.pageIndex}/${state.pageCount}`
        title = idx >= 0 ? title.substring(0, idx) : title
        view.title = `${title} (${pager})`
    }
}
