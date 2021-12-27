import { MessageOptions, window } from 'vscode';
import { BlogPost } from '../../models/blog-post';
import { PostFileMap, PostFileMapManager } from '../../services/post-file-map';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';

const confirm = async (posts: BlogPost[]): Promise<boolean> => {
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

export const deletePostToLocalFileMap = async (post: BlogPost) => {
    const view = extensionViews.postsList!;
    let selectedPosts = view.selection.filter(x => x instanceof BlogPost).map(x => x as BlogPost);
    if (!selectedPosts.includes(post)) {
        await view.reveal(post);
        selectedPosts = post ? [post] : [];
    }
    if (selectedPosts.length <= 0) {
        return;
    }
    if (!(await confirm(selectedPosts))) {
        return;
    }

    await PostFileMapManager.updateOrCreateMany(...selectedPosts.map(p => [p.id, ''] as PostFileMap));
};
