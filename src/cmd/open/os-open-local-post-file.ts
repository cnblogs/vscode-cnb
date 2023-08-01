import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'

export function osOpenLocalPostFile(post: Post | undefined) {
    if (post === undefined) return

    const postFilePath = PostFileMapManager.getFilePath(post.id)
    if (postFilePath === undefined) return

    return execCmd('revealFileInOS', Uri.file(postFilePath))
}
