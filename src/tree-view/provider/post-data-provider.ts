import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { refreshPostList } from '@/cmd/post-list/refresh-post-list'
import { Post } from '@/model/post'
import { PageModel } from '@/model/page-model'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { toTreeItem } from '@/tree-view/convert'
import { PostEntryMetadata, PostMetadata } from '@/tree-view/model/post-metadata'
import { PostSearchResultEntry } from '@/tree-view/model/post-search-result-entry'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { PostListCfg } from '@/ctx/cfg/post-list'

export type PostListTreeItem = Post | PostTreeItem | TreeItem | PostMetadata | PostSearchResultEntry

export class PostDataProvider implements TreeDataProvider<PostListTreeItem> {
    private static _instance: PostDataProvider | null = null

    protected _pagedPost?: PageModel<Post>
    protected _onDidChangeTreeData = new EventEmitter<PostListTreeItem | undefined>()

    private _searchResultEntry: PostSearchResultEntry | null = null

    protected constructor() {}

    static get instance() {
        this._instance ??= new PostDataProvider()
        return this._instance
    }

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    get pagedPost() {
        return this._pagedPost
    }

    getChildren(parent?: PostListTreeItem): ProviderResult<PostListTreeItem[]> {
        if (!parent) {
            const items: PostListTreeItem[] = this._searchResultEntry == null ? [] : [this._searchResultEntry]
            const pagedPost = this._pagedPost
            if (!pagedPost) {
                void refreshPostList()
                return items
            }
            return items.concat(...pagedPost.items)
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

    async loadPost(): Promise<PageModel<Post> | null> {
        const { pageIndex } = PostService.getPostListState() ?? {}
        const pageSize = PostListCfg.getPostListPageSize()

        this._pagedPost = await PostService.fetchPostList({ pageIndex, pageSize }).catch(e => {
            if (e instanceof Error) void Alert.err(e.message)
            else void Alert.err(`加载博文失败\n${JSON.stringify(e)}`)
            return undefined
        })

        this.fireTreeDataChangedEvent(undefined)

        return this._pagedPost ?? null
    }

    fireTreeDataChangedEvent(item: PostListTreeItem | undefined): void
    fireTreeDataChangedEvent(id: number): void
    fireTreeDataChangedEvent(item: PostListTreeItem | number | undefined): void {
        return typeof item === 'number'
            ? [
                  ...(this._pagedPost?.items.filter(x => x.id === item) ?? []),
                  ...(this._searchResultEntry?.children.filter(x => x instanceof PostTreeItem && x.post.id === item) ??
                      []),
              ].forEach(data => this._onDidChangeTreeData.fire(data))
            : this._onDidChangeTreeData.fire(item)
    }

    async search({ key }: { key: string }): Promise<void> {
        if (key.length <= 0) return

        const { items, postsCount, zzkSearchResult } = await PostService.fetchPostList({ search: key })

        this._searchResultEntry = new PostSearchResultEntry(key, items, postsCount, zzkSearchResult)
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

export const postDataProvider = PostDataProvider.instance
