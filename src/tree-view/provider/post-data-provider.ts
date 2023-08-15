import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { toTreeItem } from '@/tree-view/convert'
import { PostEntryMetadata, PostMetadata } from '@/tree-view/model/post-metadata'
import { PostSearchResultEntry } from '@/tree-view/model/post-search-result-entry'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { PostListCfg } from '@/ctx/cfg/post-list'
import { Page } from '@/model/page'
import { PostListView } from '@/cmd/post-list/post-list-view'

export type PostListTreeItem = Post | PostTreeItem | TreeItem | PostMetadata | PostSearchResultEntry

export class PostDataProvider implements TreeDataProvider<PostListTreeItem> {
    private page: Page<Post> | null = null
    private _onDidChangeTreeData = new EventEmitter<PostListTreeItem | undefined>()
    private _searchResultEntry: PostSearchResultEntry | null = null

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    getPage() {
        return this.page
    }

    getChildren(parent?: PostListTreeItem): ProviderResult<PostListTreeItem[]> {
        if (!parent) {
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

    async loadPost() {
        const { pageIndex } = PostService.getPostListState()
        const pageCap = PostListCfg.getPostListPageSize()

        try {
            const result = await PostService.getPostList(pageIndex, pageCap)
            this.page = {
                index: pageIndex,
                cap: pageCap,
                // TODO: need better design
                items: result.map(it => Object.assign(new Post(), it)),
            }

            this.fireTreeDataChangedEvent(undefined)

            return this.page
        } catch (e) {
            void Alert.err(`加载博文失败: ${<string>e}`)
            throw e
        }
    }

    fireTreeDataChangedEvent(item: PostListTreeItem | undefined): void
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

    async search({ key }: { key: string }): Promise<void> {
        if (key.length <= 0) return

        const data = await PostService.fetchPostList({ search: key })
        const postList = data.page.items
        const matchedPostCount = data.matchedPostCount
        const zzkResult = data.zzkResult

        this._searchResultEntry = new PostSearchResultEntry(key, postList, matchedPostCount, zzkResult)
        this.fireTreeDataChangedEvent(undefined)
    }

    clearSearch() {
        this._searchResultEntry = null
        this.fireTreeDataChangedEvent(undefined)
    }

    async refreshSearch(): Promise<void> {
        const { _searchResultEntry } = this

        if (_searchResultEntry) {
            const { searchKey } = _searchResultEntry
            this._searchResultEntry = null
            await this.search({ key: searchKey })
        }
    }
}

export const postDataProvider = new PostDataProvider()
