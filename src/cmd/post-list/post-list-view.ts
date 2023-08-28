import { globalCtx } from '@/ctx/global-ctx'
import { window } from 'vscode'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { Alert } from '@/infra/alert'
import { PostListState } from '@/model/post-list-state'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { execCmd } from '@/infra/cmd'
import { PageList } from '@/model/page'
import { getListState, updatePostListState } from '@/service/post/post-list-view'

let refreshTask: Promise<boolean> | null = null
let isRefreshing = false

async function setRefreshing(value = false) {
    const extName = globalCtx.extName
    await execCmd('setContext', `${extName}.post.list-view.refreshing`, value).then(undefined, () => false)
    isRefreshing = value
}

async function setPostListContext(pageCount: number, hasPrev: boolean, hasNext: boolean) {
    const extName = globalCtx.extName
    await execCmd('setContext', `${extName}.post.list-view.hasPrev`, hasPrev)
    await execCmd('setContext', `${extName}.post.list-view.hasNext`, hasNext)
    await execCmd('setContext', `${extName}.post.list-view.pageCount`, pageCount)
}

async function goPage(f: (currentIndex: number) => number) {
    if (isRefreshing) return

    const state = getListState()
    let pageIndex = state?.pageIndex ?? 1
    pageIndex = f(pageIndex)
    await PostListView.refresh({ pageIndex: pageIndex })
}

function isPageIndexInRange(pageIndex: number, state: PostListState) {
    return pageIndex <= state.pageCount && pageIndex >= 1
}

function updatePostListViewTitle() {
    const state = getListState()
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

export namespace PostListView {
    export async function refresh({ queue = false, pageIndex = 1 } = {}): Promise<boolean> {
        if (isRefreshing && !queue) {
            await refreshTask
            return false
        } else if (isRefreshing && refreshTask != null) {
            await refreshTask
            return refresh()
        }

        const fut = async () => {
            await setRefreshing(true)
            const page = await postDataProvider.loadPosts(pageIndex)
            const pageSize = page?.size ?? 30
            const pageCount = page?.count ?? 1
            const hasPrev = PageList.hasPrev(pageIndex)
            const hasNext = PageList.hasNext(pageIndex, pageCount)

            await setPostListContext(pageCount, hasPrev, hasNext)
            await updatePostListState(pageIndex, pageSize, pageCount, hasPrev, hasNext)
            updatePostListViewTitle()
            await postDataProvider.refreshSearch()
            await setRefreshing(false)
        }

        refreshTask = fut()
            .then(() => true)
            .catch(e => {
                void Alert.err(`刷新博文列表失败: ${<string>e}`)
                return false
            })
            .finally(() => (refreshTask = null))

        return refreshTask
    }

    export const goNext = () => goPage(i => i + 1)

    export const goPrev = () => goPage(i => i - 1)

    export async function seek() {
        const input = await window.showInputBox({
            placeHolder: '请输入页码',
            validateInput: i => {
                const n = Number.parseInt(i)
                if (isNaN(n) || n === 0) return '请输入正确格式的页码'

                const state = getListState()
                if (state === undefined) return undefined

                if (isPageIndexInRange(n, state)) return undefined

                return `页码超出范围, 页码范围: 1-${state.pageCount}`
            },
        })
        const pageIndex = Number.parseInt(input ?? '-1')
        if (pageIndex > 0 && !isNaN(pageIndex)) await goPage(() => pageIndex)
    }

    export namespace Search {
        export async function search() {
            const searchKey = await window.showInputBox({
                ignoreFocusOut: true,
                title: '搜索博文',
                prompt: '输入关键词搜索博文',
                placeHolder: '在此输入关键词',
                validateInput: value => (value.length <= 30 ? null : '最多输入30个字符'),
            })
            if (searchKey === undefined) return

            await postDataProvider.search({ key: searchKey })
        }

        export const clear = () => postDataProvider.clearSearch()

        export const refresh = () => postDataProvider.refreshSearch()
    }
}
