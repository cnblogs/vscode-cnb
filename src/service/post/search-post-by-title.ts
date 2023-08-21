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

export function searchPostByTitle(postTitle: string, quickPickTitle: string) {
    const quickPick = window.createQuickPick<PostPickItem>()
    quickPick.title = quickPickTitle
    quickPick.value = postTitle ?? ''
    quickPick.placeholder = '输入标题以搜索博文'

    const handleValueChange = async () => {
        if (quickPick.value === '') return

        const value = quickPick.value
        quickPick.busy = true

        try {
            const data = await PostService.fetchPostList({ search: value })
            const postList = data.page.items
            const pickItems = postList.map(p => new PostPickItem(p))
            if (value === quickPick.value) quickPick.items = pickItems
        } catch (e) {
            throw Error(`请求博文列表失败: ${<string>e}`)
        } finally {
            quickPick.busy = false
        }
    }

    quickPick.onDidChangeValue(handleValueChange)
    let selected: PostPickItem | undefined = undefined
    quickPick.onDidChangeSelection(() => {
        selected = quickPick.selectedItems[0]
        if (selected !== undefined) quickPick.hide()
    })

    const fut = new Promise<Post | undefined>(resolve => {
        quickPick.onDidHide(() => {
            resolve(selected?.post)
            quickPick.dispose()
        })
    })

    quickPick.show()
    void handleValueChange()

    return fut
}
