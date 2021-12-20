import { ProgressLocation, QuickPickItem, Uri, window, workspace } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { PostFileMap, PostFileMapManager } from '../services/post-file-map';
import { postsDataProvider } from '../tree-view-providers/blog-posts-data-provider';
import { extensionViews } from '../tree-view-providers/tree-view-registration';
import { refreshPostsList } from './posts-list';

const requireConfirm = async (selectedPosts: BlogPost[]): Promise<boolean> => {
    if (!selectedPosts || selectedPosts.length <= 0) {
        return false;
    }
    const items = ['确定', '取消'];
    const input = await window.showQuickPick(items, {
        title: `确定要删除 ${selectedPosts.map(x => x.title).join(', ')} 这${selectedPosts.length}篇博文吗?`,
        placeHolder: '请谨慎操作!',
    });
    return input === items[0];
};

const askIsToDeleteLocalFile = async (selectedPosts: BlogPost[]) => {
    if (!selectedPosts || selectedPosts.length <= 0) {
        return false;
    }
    const items: QuickPickItem[] = [
        {
            label: '是',
            picked: false,
        },
        {
            label: '否',
            picked: true,
        },
    ];
    const input = await window.showQuickPick(items, {
        title: `是否要同时删除本地文件?`,
        placeHolder: '',
    });
    if (input === undefined) {
        throw Error('canceled');
    }
    return input === items[0];
};

export const deleteSelectedPosts = async (post: BlogPost) => {
    const selectedPosts: BlogPost[] = [...(post ? [post] : [])];
    extensionViews.postsList?.selection.map(post => {
        if (post instanceof BlogPost && !selectedPosts.includes(post)) {
            postsDataProvider.pagedPosts?.items.find(item => item === post);
            selectedPosts.push(post);
        }
    });
    if (selectedPosts.length <= 0) {
        return;
    }

    if (!(await requireConfirm(selectedPosts))) {
        return;
    }

    let isToDeleteLocalFile = false;
    try {
        isToDeleteLocalFile = selectedPosts.some(x => PostFileMapManager.getFilePath(x.id))
            ? await askIsToDeleteLocalFile(selectedPosts)
            : false;
    } catch {
        AlertService.warning('操作取消');
        return;
    }

    await window.withProgress({ location: ProgressLocation.Notification }, async progress => {
        progress.report({
            message: `正在删除...`,
            increment: 0,
        });
        try {
            await blogPostService.deletePosts(selectedPosts.map(p => p.id));
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
            refreshPostsList();
        } catch (err) {
            AlertService.error(err instanceof Error ? err.message : `删除博文失败\n${JSON.stringify(err)}`);
        } finally {
            progress.report({
                increment: 100,
            });
        }
    });
};
