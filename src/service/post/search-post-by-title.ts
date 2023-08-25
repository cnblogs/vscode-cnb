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

export function searchPostByTitle(title: string, quickPickTitle: string) {
    const quickPick = window.createQuickPick<PostPickItem>()
    quickPick.title = quickPickTitle
    quickPick.value = title ?? ''
    quickPick.placeholder = '输入标题以搜索随笔'

    const handleValueChange = async () => {
        if (quickPick.value.length === 0) return

        const keyword = quickPick.value
        quickPick.busy = true

        try {
            const data = await PostService.search(1, 20, keyword)
            const postList = data.page.items
            const pickItems = postList.map(p => new PostPickItem(p))
            if (keyword === quickPick.value) quickPick.items = pickItems
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
