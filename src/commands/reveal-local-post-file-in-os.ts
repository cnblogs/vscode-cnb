import { Post } from '@/models/post'
import { PostFileMapManager } from '@/services/post-file-map'
import { execCmd } from '@/utils/cmd'
import { Uri } from 'vscode'

export const revealLocalPostFileInOs = (post: Post) => {
    if (!post) return

    const postFilePath = PostFileMapManager.getFilePath(post.id)
    if (!postFilePath) return

    return execCmd('revealFileInOS', Uri.file(postFilePath))
}
