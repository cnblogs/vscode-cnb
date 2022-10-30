import { MessageOptions, window } from 'vscode';
import { Post } from '../../models/post';
import { PostFileMap, PostFileMapManager } from '../../services/post-file-map';
import { revealPostsListItem } from '../../services/posts-list-view';
import { PostTreeItem } from '../../tree-view-providers/models/post-tree-item';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';

const confirm = async (posts: Post[]): Promise<boolean> => {
    const options = ['确定'];
    const input = await window.showInformationMessage(
        '确定要取消这些博文与本地文件的关联吗?',
        {
            detail: posts.map(x => x.title).join(', '),
            modal: true,
        } as MessageOptions,
        ...options
    );
    return input === options[0];
};

export const deletePostToLocalFileMap = async (post: Post | PostTreeItem) => {
    post = post instanceof PostTreeItem ? post.post : post;
    const view = extensionViews.postsList;
    let selectedPosts = view.selection
        .map(x => (x instanceof Post ? x : x instanceof PostTreeItem ? x.post : null))
        .filter((x): x is Post => x != null);
    if (!selectedPosts.includes(post)) {
        await revealPostsListItem(post);
        selectedPosts = post ? [post] : [];
    }
    if (selectedPosts.length <= 0) return;

    if (!(await confirm(selectedPosts))) return;

    await PostFileMapManager.updateOrCreateMany(...selectedPosts.map(p => [p.id, ''] as PostFileMap));
};
