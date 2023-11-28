import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { toTreeItem } from '@/tree-view/convert'
import { PostEntryMetadata, PostMetadata } from '@/tree-view/model/post-metadata'
import { PostSearchResultEntry } from '@/tree-view/model/post-search-result-entry'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { PostListCfg } from '@/ctx/cfg/post-list'
import { Page, PageList } from '@/model/page'
import { PostListView } from '@/cmd/post-list/post-list-view'
import { UserService } from '@/service/user.service'

export type PostListTreeItem = Post | PostTreeItem | TreeItem | PostMetadata | PostSearchResultEntry

export class PostDataProvider implements TreeDataProvider<PostListTreeItem> {
    private page: Page<Post> | null = null
    private _onDidChangeTreeData = new EventEmitter<PostListTreeItem | undefined>()
    private _searchResultEntry: PostSearchResultEntry | null = null

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined)
    }

    getPage() {
        return this.page
    }

    getChildren(parent?: PostListTreeItem): ProviderResult<PostListTreeItem[]> {
        if (parent === undefined) {
            const items: PostListTreeItem[] = this._searchResultEntry == null ? [] : [this._searchResultEntry]

            if (this.page == null) {
                void PostListView.refresh()
                return items
            }

            return items.concat(this.page.items)
        } else if (parent instanceof Post) {
            return PostMetadata.parseRoots({ post: parent })
        } else if (parent instanceof PostEntryMetadata || parent instanceof PostSearchResultEntry) {
            return parent.getChildrenAsync()
        }

        return []
    }

    getParent(el: PostListTreeItem) {
        return el instanceof PostMetadata ? el.parent : undefined
    }

    getTreeItem(item: PostListTreeItem): TreeItem | Thenable<TreeItem> {
        return toTreeItem(item)
    }

    async loadPosts(pageIndex: number): Promise<Page<Post> | null> {
        const pageSize = PostListCfg.getListPageSize() ?? 30

        try {
            const result = await PostService.getPosts({ pageIndex, pageSize })

            this.page = {
                index: result.pageIndex,
                size: pageSize,
                count: PageList.calcPageCount(pageSize, result.postsCount),
                items: result.postList.map(x => Object.assign(new Post(), x)),
            }

            this.fireTreeDataChangedEvent()

            return this.page
        } catch (e) {
            if (await UserService.hasBlog()) void Alert.err(`加载博文失败: ${<string>e}`)
            throw e
        }
    }

    fireTreeDataChangedEvent(item?: PostListTreeItem): void
    fireTreeDataChangedEvent(id: number): void
    fireTreeDataChangedEvent(item: PostListTreeItem | number | undefined): void {
        if (typeof item !== 'number') this._onDidChangeTreeData.fire(item)

        const id = item

        const postList = this.page?.items.filter(post => post.id === id) ?? []
        const resultList =
            this._searchResultEntry?.children.filter(x => x instanceof PostTreeItem && x.post.id === id) ?? []

        const sum = [...postList, ...resultList]

        sum.forEach(data => this._onDidChangeTreeData.fire(data))
    }

    async search(keyword: string) {
        if (keyword.length === 0) return

        const data = await PostService.search(1, 20, keyword)
        const postList = data.page.items
        const matchedPostCount = data.matchedPostCount
        const zzkResult = data.zzkResult

        this._searchResultEntry = new PostSearchResultEntry(keyword, postList, matchedPostCount, zzkResult)
        this.fireTreeDataChangedEvent()
    }

    clearSearch() {
        this._searchResultEntry = null
        this.fireTreeDataChangedEvent()
    }

    async refreshSearch(): Promise<void> {
        if (this._searchResultEntry !== null) {
            const searchKey = this._searchResultEntry.searchKey
            this._searchResultEntry = null
            await this.search(searchKey)
        }
    }
}

export const postDataProvider = new PostDataProvider()
