import { homedir } from 'os';
import { Event, EventEmitter, MarkdownString, ProviderResult, TreeDataProvider, TreeItem, Uri } from 'vscode';
import { refreshPostsList } from '../commands/posts-list/refresh-posts-list';
import { Post } from '../models/post';
import { PageModel } from '../models/page-model';
import { AlertService } from '../services/alert.service';
import { postService } from '../services/post.service';
import { globalState } from '../services/global-state';
import { PostFileMapManager } from '../services/post-file-map';
import { Settings } from '../services/settings.service';

export type PostDataProviderItem = Post | TreeItem;

export class PostsDataProvider implements TreeDataProvider<PostDataProviderItem> {
    private static _instance?: PostsDataProvider;

    protected _pagedPosts?: PageModel<Post>;
    protected _onDidChangeTreeData = new EventEmitter<PostDataProviderItem | undefined>();

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

    getChildren(parent?: PostDataProviderItem): ProviderResult<PostDataProviderItem[]> {
        return new Promise<PostDataProviderItem[]>(resolve => {
            if (!parent) {
                const pagedPosts = this._pagedPosts;
                if (!pagedPosts) {
                    void refreshPostsList();
                    resolve([]);
                    return;
                }
                resolve([...pagedPosts.items]);
            } else {
                resolve([]);
            }
        });
    }

    getParent(el: PostDataProviderItem) {
        return el instanceof Post ? undefined : undefined;
    }

    readonly onDidChangeTreeData: Event<PostDataProviderItem | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    getTreeItem(item: PostDataProviderItem): TreeItem | Thenable<TreeItem> {
        if (item instanceof TreeItem) {
            return item;
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
            const { pageIndex, pageSize } = postService.postsListState ?? {
                pageIndex: undefined,
                pageSize: undefined,
            };
            this._pagedPosts = await postService.fetchPostsList({ pageIndex, pageSize });
            this.fireTreeDataChangedEvent(undefined);
        } catch (ex) {
            if (ex instanceof Error) {
                AlertService.error(ex.message);
            } else {
                AlertService.error(`Failed to fetch posts list\n${JSON.stringify(ex)}`);
            }
        }
    }

    fireTreeDataChangedEvent(post: PostDataProviderItem | undefined) {
        this._onDidChangeTreeData.fire(post);
    }
}

export const postsDataProvider = PostsDataProvider.instance;
