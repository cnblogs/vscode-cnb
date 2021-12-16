import { homedir } from 'os';
import { Event, EventEmitter, MarkdownString, ProviderResult, ThemeIcon, TreeDataProvider, TreeItem } from 'vscode';
import { refreshPostsList } from '../commands/posts-list';
import { BlogPost } from '../models/blog-post';
import { PageModel } from '../models/page-model';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { globalState } from '../services/global-state';
import { PostFileMapManager } from '../services/post-file-map';

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
                refreshPostsList();
                return [];
            }
            return this._pagedPosts.items;
        }
    }

    readonly onDidChangeTreeData: Event<void | BlogPost | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    getTreeItem(post: BlogPost): TreeItem | Thenable<TreeItem> {
        const descDatePublished = post.datePublished ? `  \n发布于: ${post.datePublished}` : '';
        const localPath = PostFileMapManager.getFilePath(post.id);
        const localPathForDesc = localPath?.replace(homedir(), '~') || '未关联本地文件';
        const descLocalPath = `  \n本地路径: ${localPathForDesc}`;
        let url = post.url;
        url = url.startsWith('//') ? `https:${url}` : url;
        return {
            id: `${post.id}`,
            label: `${post.title}`,
            tooltip: new MarkdownString(`[${url}](${url})` + descDatePublished + descLocalPath),
            command: {
                command: `${globalState.extensionName}.edit-post`,
                arguments: [post.id],
                title: '编辑博文',
            },
            contextValue: PostFileMapManager.getFilePath(post.id) !== undefined ? 'cnb-post-cached' : 'cnb-post',
            iconPath: new ThemeIcon(post.isMarkdown ? 'markdown' : 'file-text'),
            description: localPathForDesc,
        };
    }

    async loadPosts(): Promise<void> {
        try {
            const { pageIndex, pageSize } = blogPostService.postsListState ?? {
                pageIndex: undefined,
                pageSize: undefined,
            };
            this._pagedPosts = await blogPostService.fetchPostsList({ pageIndex, pageSize });
            this.fireTreeDataChangedEvent(undefined);
        } catch (e) {
            if (e instanceof Error) {
                AlertService.error(e.message);
            } else {
                AlertService.error(`Failed to fetch posts list\n${JSON.stringify(e)}`);
            }
        }
    }

    fireTreeDataChangedEvent(post: BlogPost | undefined) {
        this._onDidChangeTreeData.fire(post);
    }
}

export const postsDataProvider = BlogPostsDataProvider.instance;
