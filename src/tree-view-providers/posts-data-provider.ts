import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { refreshPostsList } from '@/commands/posts-list/refresh-posts-list'
import { Post } from '@/models/post'
import { PageModel } from '@/models/page-model'
import { AlertService } from '@/services/alert.service'
import { postService } from '@/services/post.service'
import { Settings } from '@/services/settings.service'
import { toTreeItem } from './converters'
import { PostEntryMetadata, PostMetadata } from './models/post-metadata'
import { PostSearchResultEntry } from './models/post-search-result-entry'
import { PostTreeItem } from './models/post-tree-item'

export type PostsListTreeItem = Post | PostTreeItem | TreeItem | PostMetadata | PostSearchResultEntry

export class PostsDataProvider implements TreeDataProvider<PostsListTreeItem> {
    private static _instance?: PostsDataProvider

    protected _pagedPosts?: PageModel<Post>
    protected _onDidChangeTreeData = new EventEmitter<PostsListTreeItem | undefined>()

    private _searchResultEntry: PostSearchResultEntry | null = null

    protected constructor() {}

    static get instance() {
        this._instance ??= new PostsDataProvider()
        return this._instance
    }

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    get pagedPosts() {
        return this._pagedPosts
    }

    getChildren(parent?: PostsListTreeItem): ProviderResult<PostsListTreeItem[]> {
        if (!parent) {
            const items: PostsListTreeItem[] = this._searchResultEntry == null ? [] : [this._searchResultEntry]
            const pagedPosts = this._pagedPosts
            if (!pagedPosts) {
                void refreshPostsList()
                return items
            }
            return items.concat(...pagedPosts.items)
        } else if (parent instanceof Post) {
            return PostMetadata.parseRoots({ post: parent })
        } else if (parent instanceof PostEntryMetadata || parent instanceof PostSearchResultEntry) {
            return parent.getChildrenAsync()
        }

        return []
    }

    getParent(el: PostsListTreeItem) {
        return el instanceof PostMetadata ? el.parent : undefined
    }

    getTreeItem(item: PostsListTreeItem): TreeItem | Thenable<TreeItem> {
        return toTreeItem(item)
    }

    async loadPosts(): Promise<PageModel<Post> | null> {
        const { pageIndex } = postService.postsListState ?? {}
        const pageSize = Settings.postsListPageSize

        this._pagedPosts = await postService.fetchPostsList({ pageIndex, pageSize }).catch(e => {
            if (e instanceof Error) AlertService.err(e.message)
            else AlertService.err(`加载博文失败\n${JSON.stringify(e)}`)
            return undefined
        })

        this.fireTreeDataChangedEvent(undefined)

        return this._pagedPosts ?? null
    }

    fireTreeDataChangedEvent(item: PostsListTreeItem | undefined): void
    fireTreeDataChangedEvent(id: number): void
    fireTreeDataChangedEvent(item: PostsListTreeItem | number | undefined): void {
        return typeof item === 'number'
            ? [
                  ...(this._pagedPosts?.items.filter(x => x.id === item) ?? []),
                  ...(this._searchResultEntry?.children.filter(x => x instanceof PostTreeItem && x.post.id === item) ??
                      []),
              ].forEach(data => this._onDidChangeTreeData.fire(data))
            : this._onDidChangeTreeData.fire(item)
    }

    async search({ key }: { key: string }): Promise<void> {
        if (key.length <= 0) return

        const { items, totalItemsCount, zzkSearchResult } = await postService.fetchPostsList({ search: key })

        this._searchResultEntry = new PostSearchResultEntry(key, items, totalItemsCount, zzkSearchResult)
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

export const postsDataProvider = PostsDataProvider.instance
