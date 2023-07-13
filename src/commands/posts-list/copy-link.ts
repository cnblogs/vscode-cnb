import { TreeViewCommandHandler } from '@/commands/command-handler'
import { Post } from '@/models/post'
import { AlertService } from '@/services/alert.service'
import { PostFileMapManager } from '@/services/post-file-map'
import { postService } from '@/services/post.service'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'
import { env, MessageItem, Uri, window } from 'vscode'

type LinkFormat = 'markdown' | 'raw' | 'id'
interface CopyStrategy {
    name: string
    provideContent: (post: Post) => Thenable<string>
}

export class CopyPostLinkCommandHandler extends TreeViewCommandHandler<Thenable<Post | null | undefined>> {
    private readonly _strategies: { [key in LinkFormat]: CopyStrategy } = {
        raw: {
            name: '复制链接',
            provideContent: ({ url }) => Promise.resolve(url),
        },
        markdown: {
            name: '复制markdown格式链接',
            provideContent: ({ url, title }) => Promise.resolve(`[${title}](${url})`),
        },
        id: {
            name: '复制Id',
            provideContent: ({ id }) => Promise.resolve(`${id}`),
        },
    }

    constructor(public readonly input: unknown) {
        super()
    }

    async handle(): Promise<void> {
        const post = await this.parseInput()

        if (post == null) return

        const linkFormat = await this.askFormat()
        if (linkFormat == null) return

        const contentToCopy = await this._strategies[linkFormat].provideContent(post)
        if (contentToCopy.length > 0) await env.clipboard.writeText(contentToCopy)
    }

    parseInput(): Thenable<Post | null | undefined> {
        const { input } = this
        if (input instanceof Post) {
            return Promise.resolve(input)
        } else if (input instanceof PostTreeItem) {
            return Promise.resolve(input.post)
        } else if (input instanceof Uri) {
            const postId = PostFileMapManager.findByFilePath(input.fsPath)?.[0]
            return postId == null || postId <= 0
                ? Promise.resolve(undefined).then(() => void AlertService.fileNotLinkedToPost(input))
                : postService.fetchPostEditDto(postId).then(v => v?.post)
        }

        return Promise.resolve(undefined)
    }

    private askFormat(): Thenable<LinkFormat | undefined | null> {
        return window
            .showInformationMessage(
                '选择链接格式',
                { modal: true },
                ...(Object.keys(this._strategies) as LinkFormat[]).map<MessageItem & { format: LinkFormat }>(f => ({
                    title: this._strategies[f].name,
                    format: f,
                    isCloseAffordance: false,
                }))
            )
            .then(x => x?.format)
    }
}
