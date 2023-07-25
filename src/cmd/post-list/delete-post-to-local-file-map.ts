import { MessageOptions } from 'vscode'
import { Post } from '@/model/post'
import { PostFileMap, PostFileMapManager } from '@/service/post-file-map'
import { revealPostListItem } from '@/service/post-list-view'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { extTreeViews } from '@/tree-view/tree-view-register'
import { Alert } from '@/service/alert'

const confirm = async (postList: Post[]): Promise<boolean> => {
    const options = ['确定']
    const input = await Alert.info(
        '确定要取消这些博文与本地文件的关联吗?',
        {
            detail: postList.map(x => x.title).join(', '),
            modal: true,
        } as MessageOptions,
        ...options
    )
    return input === options[0]
}

export const deletePostToLocalFileMap = async (post: Post | PostTreeItem) => {
    post = post instanceof PostTreeItem ? post.post : post
    const view = extTreeViews.postList
    let selectedPost = view.selection
        .map(x => (x instanceof Post ? x : x instanceof PostTreeItem ? x.post : null))
        .filter((x): x is Post => x != null)
    if (!selectedPost.includes(post)) {
        await revealPostListItem(post)
        selectedPost = post ? [post] : []
    }
    if (selectedPost.length <= 0) return

    if (!(await confirm(selectedPost))) return

    await PostFileMapManager.updateOrCreateMany(selectedPost.map(p => [p.id, ''] as PostFileMap))
}
