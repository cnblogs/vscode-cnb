import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { refreshPostsList } from '../commands/posts-list/refresh-posts-list';
import { Post } from '../models/post';
import { PageModel } from '../models/page-model';
import { AlertService } from '../services/alert.service';
import { postService } from '../services/post.service';
import { Settings } from '../services/settings.service';
import { toTreeItem } from './converters';
import { PostEntryMetadata, PostMetadata } from './models/post-metadata';
import { PostSearchResultEntry } from './models/post-search-result-entry';
import { PostTreeItem } from './models/post-tree-item';

export type PostsListTreeItem = Post | PostTreeItem | TreeItem | PostMetadata | PostSearchResultEntry;

export class PostsDataProvider implements TreeDataProvider<PostsListTreeItem> {
    private static _instance?: PostsDataProvider;
    private _searchResultEntry: PostSearchResultEntry | null = null;

    protected _pagedPosts?: PageModel<Post>;
    protected _onDidChangeTreeData = new EventEmitter<PostsListTreeItem | undefined>();

    static get instance() {
        if (!this._instance) {
            this._instance = new PostsDataProvider();
        }

        return this._instance;
    }

    get pagedPosts() {
        return this._pagedPosts;
    }

    protected constructor() {}

    getChildren(parent?: PostsListTreeItem): ProviderResult<PostsListTreeItem[]> {
        if (!parent) {
            const items: PostsListTreeItem[] = this._searchResultEntry == null ? [] : [this._searchResultEntry];
            const pagedPosts = this._pagedPosts;
            if (!pagedPosts) {
                void refreshPostsList();
                return items;
            }
            return items.concat(...pagedPosts.items);
        } else if (parent instanceof Post) {
            return PostMetadata.parseRoots({ post: parent });
        } else if (parent instanceof PostEntryMetadata || parent instanceof PostSearchResultEntry) {
            return parent.getChildrenAsync();
        } else {
            return [];
        }
    }

    getParent(el: PostsListTreeItem) {
        return el instanceof PostMetadata ? el.parent : undefined;
    }

    readonly onDidChangeTreeData: Event<PostsListTreeItem | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    getTreeItem(item: PostsListTreeItem): TreeItem | Thenable<TreeItem> {
        return toTreeItem(item);
    }

    async loadPosts(): Promise<PageModel<Post> | null> {
        try {
            const { pageIndex } = postService.postsListState ?? {};
            const pageSize = Settings.postsListPageSize;
            this._pagedPosts = await postService.fetchPostsList({ pageIndex, pageSize });
            this.fireTreeDataChangedEvent(undefined);
            return this._pagedPosts;
        } catch (ex) {
            if (ex instanceof Error) {
                AlertService.error(ex.message);
            } else {
                AlertService.error(`Failed to fetch posts list\n${JSON.stringify(ex)}`);
            }

            return null;
        }
    }

    fireTreeDataChangedEvent(item: PostsListTreeItem | undefined): void;
    fireTreeDataChangedEvent(id: number): void;
    fireTreeDataChangedEvent(item: PostsListTreeItem | number | undefined): void {
        return typeof item === 'number'
            ? [
                  ...(this._pagedPosts?.items.filter(x => x.id === item) ?? []),
                  ...(this._searchResultEntry?.children.filter(x => x instanceof PostTreeItem && x.post.id === item) ??
                      []),
              ].forEach(data => this._onDidChangeTreeData.fire(data))
            : this._onDidChangeTreeData.fire(item);
    }

    async search({ key }: { key: string }): Promise<void> {
        if (key.length <= 0) {
            return;
        }
        const { items, totalItemsCount, zzkSearchResult } = await postService.fetchPostsList({ search: key });

        this._searchResultEntry = new PostSearchResultEntry(key, items, totalItemsCount, zzkSearchResult);
        this.fireTreeDataChangedEvent(undefined);
    }

    clearSearch() {
        this._searchResultEntry = null;
        this.fireTreeDataChangedEvent(undefined);
    }

    async refreshSearch(): Promise<void> {
        const { _searchResultEntry } = this;
        if (_searchResultEntry) {
            const { searchKey } = _searchResultEntry;
            this._searchResultEntry = null;
            await this.search({ key: searchKey });
        }
    }
}

export const postsDataProvider = PostsDataProvider.instance;
