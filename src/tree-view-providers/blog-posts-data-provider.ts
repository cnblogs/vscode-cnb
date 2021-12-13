import { Event, EventEmitter, MarkdownString, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { BlogPost } from '../models/blog-post';
import { PageModel } from '../models/page-model';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';

export class BlogPostsDataProvider implements TreeDataProvider<BlogPost> {
    private static _instance?: BlogPostsDataProvider;

    protected _pagedPosts?: PageModel<BlogPost>;
    protected _onDidChangeTreeData = new EventEmitter<BlogPost | undefined>();

    static get instance() {
        if (!this._instance) {
            this._instance = new BlogPostsDataProvider();
        }

        return this._instance;
    }

    get pagedPosts() {
        return this._pagedPosts;
    }

    protected constructor() {}

    getChildren(element?: BlogPost): ProviderResult<BlogPost[]> {
        if (element) {
            return [];
        } else {
            if (!this._pagedPosts) {
                this.loadPosts();
                return [];
            }
            return this._pagedPosts.items;
        }
    }

    readonly onDidChangeTreeData: Event<void | BlogPost | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    getTreeItem(post: BlogPost): TreeItem | Thenable<TreeItem> {
        const descDatePublished = post.datePublished ? `  \n发布于: ${post.datePublished}` : '';
        let url = post.url;
        url = url.startsWith('//') ? `https:${url}` : url;
        return {
            id: `${post.id}`,
            label: `${post.title}`,
            tooltip: new MarkdownString(`[${url}](${url})` + descDatePublished),
        };
    }

    async loadPosts(): Promise<void> {
        try {
            const { pageIndex, pageSize } = blogPostService.postsListState ?? {
                pageIndex: undefined,
                pageSize: undefined,
            };
            this._pagedPosts = await blogPostService.fetchPostsList({ pageIndex, pageSize });
            this._onDidChangeTreeData.fire(undefined);
        } catch (e) {
            if (e instanceof Error) {
                AlertService.error(e.message);
            } else {
                AlertService.error(`Failed to fetch posts list\n${JSON.stringify(e)}`);
            }
        }
    }
}

export const postsDataProvider = BlogPostsDataProvider.instance;
