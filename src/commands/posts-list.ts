import { globalManager } from '../models/global-manager';
import { blogPostService } from '../services/blog-post.service';
import * as vscode from 'vscode';
import { postsDataProvider } from '../tree-view-providers/blog-posts-data-provider';
import { AlertService } from '../services/alert.service';
import { PostsListState } from '../models/posts-list-state';
import { PageModel } from '../models/page-model';
import { BlogPost } from '../models/blog-post';

export const refreshPostsList = async () => {
    if (refreshing) {
        alertRefreshing();
        return;
    }
    await setRefreshing(true);
    let pagedPosts: PageModel<BlogPost> | undefined;
    try {
        await postsDataProvider.loadPosts();
        pagedPosts = postsDataProvider.pagedPosts;
        if (pagedPosts) {
            await blogPostService.updatePostsListState(pagedPosts);
        }
    } catch (e) {
        console.error('refresh posts list failed', e);
        AlertService.error('刷新博文列表失败');
    }
    await setHasPreviousAndNext(pagedPosts?.hasPrevious ?? false, pagedPosts?.hasNext ?? false);
    await setRefreshing(false);
};

export const gotoNextPostsList = async () => {
    gotoPage(c => c + 1);
};

export const gotoPreviousPostsList = async () => {
    gotoPage(c => c - 1);
};

let refreshing = false;
const setRefreshing = async (value = false) => {
    const extName = globalManager.extensionName;
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.refreshing`, value);
    refreshing = value;
};

const setHasPreviousAndNext = async (hasPrevious: boolean, hasNext: boolean) => {
    const extName = globalManager.extensionName;
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.hasPrevious`, hasPrevious);
    await vscode.commands.executeCommand('setContext', `${extName}.posts-list.hasNext`, hasNext);
};

const alertRefreshing = () => {
    AlertService.info('正在刷新, 请勿重复操作');
};

const gotoPage = async (pageIndex: (currentIndex: number) => number) => {
    if (refreshing) {
        alertRefreshing();
        return;
    }
    const state = blogPostService.postsListState;
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
    await blogPostService.updatePostsListState(state);
    await refreshPostsList();
};

const isPageIndexInRange = (pageIndex: number, state: PostsListState) => pageIndex <= state.pageCount && pageIndex >= 1;
