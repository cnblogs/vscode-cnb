import { Uri } from 'vscode'
import { execCmd } from '@/infra/cmd'
import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'

export function osOpenLocalPostFile(post?: Post) {
    console.log('post === undefined ? ' + (post === undefined))
    if (post === undefined) return

    console.log('post.id: ' + post.id)
    const postFilePath = PostFileMapManager.getFilePath(post.id)
    if (postFilePath === undefined) return

    console.log('postFilePath: ' + postFilePath)

    return execCmd('revealFileInOS', Uri.file(postFilePath))
}
