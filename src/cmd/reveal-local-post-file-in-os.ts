import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post-file-map'

export const revealLocalPostFileInOs = (post: Post) => {
    if (!post) return

    const postFilePath = PostFileMapManager.getFilePath(post.id)
    if (!postFilePath) return

    return execCmd('revealFileInOS', Uri.file(postFilePath))
}
