import { homedir } from 'os';
import {
    Event,
    EventEmitter,
    MarkdownString,
    ProviderResult,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
} from 'vscode';
import { refreshPostsList } from '../commands/posts-list';
import { BlogPost } from '../models/blog-post';
import { LocalPostFile } from '../models/local-post-file';
import { PageModel } from '../models/page-model';
import { AlertService } from '../services/alert.service';
import { blogPostService } from '../services/blog-post.service';
import { globalState } from '../services/global-state';
import { PostFileMapManager } from '../services/post-file-map';
import { Settings } from '../services/settings.service';

export const localDraftFolderItem: TreeItem = Object.assign(new TreeItem('本地草稿'), {
    iconPath: new ThemeIcon('folder'),
    collapsibleState: TreeItemCollapsibleState.Collapsed,
    contextValue: 'cnb-local-drafts-folder',
    description: Settings.workspaceUri.fsPath.replace(homedir(), '~'),
    tooltip: '在本地创建的还未保存到博客园的文章',
} as TreeItem);

export type BlogPostDataProviderItem = BlogPost | TreeItem | LocalPostFile;

export class BlogPostsDataProvider implements TreeDataProvider<BlogPostDataProviderItem> {
    private static _instance?: BlogPostsDataProvider;

    protected _pagedPosts?: PageModel<BlogPost>;
    protected _onDidChangeTreeData = new EventEmitter<BlogPostDataProviderItem | undefined>();

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

    getChildren(element?: BlogPostDataProviderItem): ProviderResult<BlogPostDataProviderItem[]> {
        return new Promise<BlogPostDataProviderItem[]>(resolve => {
            if (element === localDraftFolderItem) {
                LocalPostFile.read().then(v => resolve(v));
                return;
            } else if (!element) {
                const pagedPosts = this._pagedPosts;
                if (!pagedPosts) {
                    refreshPostsList();
                    resolve([localDraftFolderItem]);
                    return;
                }
                resolve([localDraftFolderItem, ...pagedPosts.items]);
            } else {
                resolve([]);
            }
        });
    }

    getParent(el: BlogPostDataProviderItem) {
        if (el instanceof LocalPostFile) {
            return localDraftFolderItem;
        }
        return undefined;
    }

    readonly onDidChangeTreeData: Event<BlogPostDataProviderItem | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    getTreeItem(item: BlogPostDataProviderItem): TreeItem | Thenable<TreeItem> {
        if (item instanceof TreeItem) {
            return item;
        }
        if (item instanceof LocalPostFile) {
            return item.toTreeItem();
        }
        const descDatePublished = item.datePublished ? `  \n发布于: ${item.datePublished}` : '';
        const localPath = PostFileMapManager.getFilePath(item.id);
        const localPathForDesc = localPath?.replace(homedir(), '~') || '未关联本地文件';
        const descLocalPath = localPath ? `  \n本地路径: ${localPathForDesc}` : '';
        let url = item.url;
        url = url.startsWith('//') ? `https:${url}` : url;
        return Object.assign(new TreeItem(`${item.title}`), {
            id: `${item.id}`,
            tooltip: new MarkdownString(`[${url}](${url})` + descDatePublished + descLocalPath),
            command: {
                command: `${globalState.extensionName}.edit-post`,
                arguments: [item.id],
                title: '编辑博文',
            },
            contextValue: PostFileMapManager.getFilePath(item.id) !== undefined ? 'cnb-post-cached' : 'cnb-post',
            // iconPath: new ThemeIcon(item.isMarkdown ? 'markdown' : 'file-text'),
            description: localPath ? localPathForDesc : '',
            resourceUri: Uri.joinPath(Settings.workspaceUri, item.title + (item.isMarkdown ? '.md' : '.html')),
        } as TreeItem);
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

    fireTreeDataChangedEvent(post: BlogPostDataProviderItem | undefined) {
        this._onDidChangeTreeData.fire(post);
    }
}

export const postsDataProvider = BlogPostsDataProvider.instance;
