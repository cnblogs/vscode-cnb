import { globalState } from '../../services/global-state';
import { postService } from '../../services/post.service';
import vscode from 'vscode';
import { postsDataProvider } from '../../tree-view-providers/posts-data-provider';
import { AlertService } from '../../services/alert.service';
import { PostsListState } from '../../models/posts-list-state';
import { window } from 'vscode';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';

let refreshTask: Promise<any> | null = null;

export const refreshPostsList = ({ queue = false } = {}): Promise<boolean> => {
    if (refreshing && !queue) {
        alertRefreshing();
        return refreshTask || Promise.resolve(false);
    } else if (refreshing && refreshTask != null) {
        return refreshTask.then(() => refreshPostsList());
    }

    refreshTask = new Promise<boolean>(resolve =>
        setRefreshing(true).finally(() =>
            postsDataProvider
                .loadPosts()
                .then(pagedPosts =>
                    setPostListContext(
                        pagedPosts?.pageCount ?? 0,
                        pagedPosts?.hasPrevious ?? false,
                        pagedPosts?.hasNext ?? false
                    ).then(() => pagedPosts)
                )
                .then(pagedPosts =>
                    pagedPosts == null
                        ? Promise.resolve(false).finally(() => AlertService.error('刷新博文列表失败'))
                        : postService
                              .updatePostsListState(pagedPosts)
                              .then(() => updatePostsListViewTitle())
                              .then(
                                  () => true,
                                  () => true
                              )
                )
                .catch(() => false)
                .then(x =>
                    postsDataProvider.refreshSearch().then(
                        () => x,
                        () => x
                    )
                )
                .then(x =>
                    setRefreshing(false).then(
                        () => x,
                        () => x
                    )
                )
                .then(undefined, () => false)
                .then(x => resolve(x))
                .finally(() => (refreshTask = null))
        )
    );

    return refreshTask;
};

export const gotoNextPostsList = async () => {
    await gotoPage(c => c + 1);
};

export const gotoPreviousPostsList = async () => {
    await gotoPage(c => c - 1);
};

export const seekPostsList = async () => {
    const input = await window.showInputBox({
        placeHolder: '请输入页码',
        validateInput: i => {
            const n = Number.parseInt(i);
            if (isNaN(n) || !n) {
                return '请输入正确格式的页码';
            }
            const state = postService.postsListState;
            if (!state) {
                return '博文列表尚未加载';
            }
            if (isPageIndexInRange(n, state)) {
                return undefined;
            }

            return `页码超出范围, 页码范围: 1-${state.pageCount}`;
        },
    });
    const pageIndex = Number.parseInt(input ?? '-1');
    if (pageIndex > 0 && !isNaN(pageIndex)) {
        await gotoPage(() => pageIndex);
    }
};

let refreshing = false;
const setRefreshing = async (value = false) => {
    const extName = globalState.extensionName;
    await vscode.commands
        .executeCommand('setContext', `${extName}.posts-list.refreshing`, value)
        .then(undefined, () => false);
    refreshing = value;
};

const setPostListContext = async (pageCount: number, hasPrevious: boolean, hasNext: boolean) => {
    const extName = globalState.extensionName;
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.hasPrevious`, hasPrevious);
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.hasNext`, hasNext);
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.pageCount`, pageCount);
};

const alertRefreshing = () => {
    AlertService.info('正在刷新, 请勿重复操作');
};

const gotoPage = async (pageIndex: (currentIndex: number) => number) => {
    if (refreshing) {
        alertRefreshing();
        return;
    }
    const state = postService.postsListState;
    if (!state) {
        console.warn('Cannot goto previous page posts list because post list state not defined');
        return;
    }
    const idx = pageIndex(state.pageIndex);
    if (!isPageIndexInRange(idx, state)) {
        console.warn(
            'Cannot goto page posts list, page index out of range, max value of page index is ' + state.pageCount
        );
        return;
    }
    state.pageIndex = idx;
    await postService.updatePostsListState(state);
    await refreshPostsList();
};

const isPageIndexInRange = (pageIndex: number, state: PostsListState) => pageIndex <= state.pageCount && pageIndex >= 1;

const updatePostsListViewTitle = () => {
    const state = postService.postsListState;
    if (!state) {
        return;
    }
    const { pageIndex, pageCount } = state;
    const views = [extensionViews.postsList, extensionViews.anotherPostsList];
    for (const view of views) {
        if (view) {
            let title = view.title!;
            const idx = title.indexOf('(');
            const pager = `第${pageIndex}页,共${pageCount}页`;
            title = idx >= 0 ? title.substring(0, idx) : title;
            view.title = `${title}(${pager})`;
        }
    }
};
