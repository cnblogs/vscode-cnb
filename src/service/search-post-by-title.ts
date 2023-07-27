import { QuickPickItem, window } from 'vscode'
import { Post } from '@/model/post'
import { PostService } from './post'

class PostPickItem implements QuickPickItem {
    label: string
    description?: string
    detail?: string
    picked?: boolean
    alwaysShow?: boolean

    constructor(public post: Post) {
        this.label = post.title
        this.description = post.description
    }
}

export const searchPostByTitle = ({ postTitle = '', quickPickTitle = '按标题搜索博文' }): Promise<Post | undefined> =>
    new Promise<Post | undefined>(resolve => {
        const quickPick = window.createQuickPick<PostPickItem>()
        quickPick.title = quickPickTitle
        quickPick.value = postTitle ?? ''
        quickPick.placeholder = '输入标题以搜索博文'
        const handleValueChange = async () => {
            if (!quickPick.value) return

            const value = quickPick.value
            try {
                quickPick.busy = true
                const paged = await PostService.fetchPostList({ search: value })
                const pickItems = paged.items.map(p => new PostPickItem(p))
                if (value === quickPick.value) quickPick.items = pickItems
            } finally {
                quickPick.busy = false
            }
        }
        quickPick.onDidChangeValue(async () => {
            await handleValueChange()
        })
        let selected: PostPickItem | undefined = undefined
        quickPick.onDidChangeSelection(() => {
            selected = quickPick.selectedItems[0]
            if (selected) quickPick.hide()
        })
        quickPick.onDidHide(() => {
            resolve(selected?.post)
            quickPick.dispose()
        })
        quickPick.show()
        void handleValueChange()
    })
