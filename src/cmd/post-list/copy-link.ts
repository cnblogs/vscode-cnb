import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { PostService } from '@/service/post/post'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { env, MessageItem, Uri } from 'vscode'

type LinkFormat = 'markdown' | 'raw' | 'id'

type CopyStrategy = {
    name: string
    provideContent: (post: Post) => string
}

const strategies: { [key in LinkFormat]: CopyStrategy } = {
    raw: {
        name: '复制链接',
        provideContent: ({ url }) => url,
    },
    markdown: {
        name: '复制markdown格式链接',
        provideContent: ({ url, title }) => `[${title}](${url})`,
    },
    id: {
        name: '复制Id',
        provideContent: ({ id }) => `${id}`,
    },
}

export async function handleCopyPostLink(input: Post | PostTreeItem | Uri) {
    let post
    if (input instanceof Post) {
        post = input
    } else if (input instanceof PostTreeItem) {
        post = input.post
    } else {
        // input instanceof Uri
        const postId = PostFileMapManager.findByFilePath(input.fsPath)?.[0]
        if (postId === undefined || postId <= 0) {
            void Alert.fileNotLinkedToPost(input)
            return
        } else {
            const dto = await PostService.getPostEditDto(postId)
            post = dto.post
        }
    }

    const answer = await Alert.info(
        '选择链接格式',
        { modal: true },
        ...(Object.keys(strategies) as LinkFormat[]).map<MessageItem & { format: LinkFormat }>(f => ({
            title: strategies[f].name,
            format: f,
            isCloseAffordance: false,
        }))
    )
    if (answer === undefined) return

    const contentToCopy = strategies[answer.format].provideContent(post)
    if (contentToCopy.length > 0) await env.clipboard.writeText(contentToCopy)
}
