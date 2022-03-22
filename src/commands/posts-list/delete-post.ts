import { MessageOptions, ProgressLocation, Uri, window, workspace } from 'vscode';
import { Post } from '../../models/post';
import { AlertService } from '../../services/alert.service';
import { postService } from '../../services/post.service';
import { PostFileMap, PostFileMapManager } from '../../services/post-file-map';
import { postsDataProvider } from '../../tree-view-providers/posts-data-provider';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';
import { refreshPostsList } from './refresh-posts-list';

let deleting = false;

const confirmDelete = async (
    selectedPosts: Post[]
): Promise<{ confirmed: boolean; deleteLocalFileAtSameTime: boolean }> => {
    const result = { confirmed: false, deleteLocalFileAtSameTime: false };
    if (!selectedPosts || selectedPosts.length <= 0) {
        return result;
    }
    const items = ['确定(保留本地文件)', '确定(同时删除本地文件)'];
    const clicked = await window.showWarningMessage(
        '确定要删除吗?',
        {
            detail: `确认后将会删除 ${selectedPosts.map(x => x.title).join(', ')} 这${selectedPosts.length}篇博文吗?`,

            modal: true,
        } as MessageOptions,
        ...items
    );
    switch (clicked) {
        case items[0]:
            result.confirmed = true;
            break;
        case items[1]:
            result.confirmed = true;
            result.deleteLocalFileAtSameTime = true;
            break;
    }
    return result;
};

export const deleteSelectedPosts = async (post: Post) => {
    const selectedPosts: Post[] = post ? [post] : [];
    extensionViews.visiblePostList()?.selection.map(post => {
        if (post instanceof Post && !selectedPosts.includes(post)) {
            postsDataProvider.pagedPosts?.items.find(item => item === post);
            selectedPosts.push(post);
        }
    });
    if (selectedPosts.length <= 0) {
        return;
    }

    if (deleting) {
        AlertService.warning('休息会儿再点吧~');
        return;
    }

    const { confirmed, deleteLocalFileAtSameTime: isToDeleteLocalFile } = await confirmDelete(selectedPosts);
    if (!confirmed) {
        return;
    }

    deleting = true;

    await window.withProgress({ location: ProgressLocation.Notification }, async progress => {
        progress.report({
            message: `正在删除...`,
            increment: 0,
        });
        try {
            await postService.deletePosts(selectedPosts.map(p => p.id));
            if (isToDeleteLocalFile) {
                selectedPosts
                    .map(p => PostFileMapManager.getFilePath(p.id) ?? '')
                    .filter(x => !!x)
                    .forEach(path => {
                        try {
                            workspace.fs.delete(Uri.file(path));
                        } catch (err) {
                            console.error(err);
                        }
                    });
            }
            await PostFileMapManager.updateOrCreateMany(...selectedPosts.map<PostFileMap>(p => [p.id, '']));
            await refreshPostsList();
        } catch (err) {
            window.showErrorMessage('删除博文失败', {
                detail: `服务器返回了错误, ${err instanceof Error ? err.message : JSON.stringify(err)}`,
            } as MessageOptions);
        } finally {
            progress.report({
                increment: 100,
            });
        }
    });

    deleting = false;
};
