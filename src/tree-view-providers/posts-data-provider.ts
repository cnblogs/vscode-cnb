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
import { refreshPostsList } from '../commands/posts-list/refresh-posts-list';
import { Post } from '../models/post';
import { PageModel } from '../models/page-model';
import { AlertService } from '../services/alert.service';
import { postService } from '../services/post.service';
import { globalState } from '../services/global-state';
import { PostFileMapManager } from '../services/post-file-map';
import { Settings } from '../services/settings.service';
import { differenceInSeconds, differenceInYears, format, formatDistanceStrict } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { postCategoryService } from '../services/post-category.service';
import { PostEditDto } from '../models/post-edit-dto';
import { flattenDepth } from 'lodash';

abstract class PostMetadata {
    constructor(public parent: Post) {}

    abstract toTreeItem(): TreeItem | Promise<TreeItem>;
}

abstract class PostEntryMetadata<T extends PostMetadata> extends PostMetadata {
    constructor(parent: Post, public readonly children: T[]) {
        super(parent);
    }
}

class PostCategoryEntryMetadata extends PostEntryMetadata<PostCategoryMetadata> {
    constructor(parent: Post, children: PostMetadata[]) {
        super(
            parent,
            children.filter((x): x is PostCategoryMetadata => x instanceof PostCategoryMetadata)
        );
    }

    toTreeItem = (): TreeItem => ({
        label: '分类',
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        iconPath: new ThemeIcon('vscode-cnb-folders'),
    });
}

class PostTagEntryMetadata extends PostEntryMetadata<PostTagMetadata> {
    constructor(parent: Post, children: PostMetadata[]) {
        super(
            parent,
            children.filter((x): x is PostTagMetadata => x instanceof PostTagMetadata)
        );
    }

    toTreeItem = (): TreeItem => ({
        label: '标签',
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        iconPath: new ThemeIcon('tag'),
    });
}

class PostCategoryMetadata extends PostMetadata {
    readonly icon = new ThemeIcon('vscode-cnb-folder-close');
    constructor(parent: Post, public categoryName: string, public categoryId: number) {
        super(parent);
    }

    toTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(this.categoryName), {
            iconPath: this.icon,
        });

    static async parse(parent: Post, editDto?: PostEditDto): Promise<PostCategoryMetadata[]> {
        editDto = editDto ? editDto : await postService.fetchPostEditDto(parent.id);
        if (editDto == null) {
            return [];
        }

        const {
            post: { categoryIds },
        } = editDto;
        return (await postCategoryService.findCategories(categoryIds ?? [])).map(
            ({ categoryId, title }) => new PostCategoryMetadata(parent, title, categoryId)
        );
    }
}

class PostTagMetadata extends PostMetadata {
    readonly icon = undefined;
    constructor(parent: Post, public tag: string, public tagId?: string) {
        super(parent);
    }

    toTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(`# ${this.tag}`), {
            iconPath: this.icon,
        });

    static async parse(parent: Post, editDto?: PostEditDto): Promise<PostMetadata[]> {
        editDto = editDto ? editDto : await postService.fetchPostEditDto(parent.id);
        if (editDto == null) {
            return [];
        }

        const {
            post: { tags },
        } = editDto;
        return (tags ?? [])?.map(tag => new PostTagMetadata(parent, tag));
    }
}

abstract class PostDateMetadata extends PostMetadata {
    readonly distance: string;
    constructor(public label: string, parent: Post, public readonly date: Date) {
        super(parent);
        this.distance = this.toDistance();
    }

    get enabled(): boolean {
        return true;
    }

    get formattedDate(): string {
        return format(this.date, 'yyyy MM-dd HH:mm');
    }

    shouldUseDistance = (): boolean => differenceInYears(new Date(), this.date) < 1;
    toDistance = () => formatDistanceStrict(this.date, new Date(), { addSuffix: true, locale: zhCN });

    toTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(
            new TreeItem(
                `${this.label}: ${
                    this.shouldUseDistance() ? this.distance + `(${this.formattedDate})` : this.formattedDate
                }`
            ),
            {
                iconPath: new ThemeIcon('vscode-cnb-date'),
            }
        );
}

class PostCreatedDateMetadata extends PostDateMetadata {
    constructor(parent: Post) {
        super('创建于', parent, parent.datePublished ?? new Date());
    }
}

class PostUpdatedDate extends PostDateMetadata {
    constructor(parent: Post) {
        super('更新于', parent, parent.dateUpdated ?? new Date());
    }

    get enabled(): boolean {
        const { datePublished, dateUpdated } = this.parent;
        const now = new Date();
        return differenceInSeconds(dateUpdated ?? now, datePublished ?? now) > 0;
    }
}

export type PostTreeViewItem = Post | TreeItem | PostMetadata;

export class PostsDataProvider implements TreeDataProvider<PostTreeViewItem> {
    private static _instance?: PostsDataProvider;

    protected _pagedPosts?: PageModel<Post>;
    protected _onDidChangeTreeData = new EventEmitter<PostTreeViewItem | undefined>();

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

    getChildren(parent?: PostTreeViewItem): ProviderResult<PostTreeViewItem[]> {
        return new Promise<PostTreeViewItem[]>(resolve => {
            if (!parent) {
                const pagedPosts = this._pagedPosts;
                if (!pagedPosts) {
                    void refreshPostsList();
                    resolve([]);
                    return;
                }
                resolve([...pagedPosts.items]);
            } else if (parent instanceof Post) {
                const metadata = [new PostUpdatedDate(parent), new PostCreatedDateMetadata(parent)].filter(
                    x => x.enabled
                );
                Promise.all<PostMetadata[]>([
                    PostCategoryMetadata.parse(parent).catch((): PostMetadata[] => []),
                    PostTagMetadata.parse(parent).catch((): PostMetadata[] => []),
                ])
                    .then(
                        values => flattenDepth(values, 1),
                        (): PostMetadata[] => []
                    )
                    .then(values => [
                        new PostCategoryEntryMetadata(parent, values),
                        new PostTagEntryMetadata(parent, values),
                    ])
                    .then(
                        values => resolve([...metadata, ...values.filter(x => x.children.length > 0)]),
                        () => resolve(metadata)
                    );
            } else if (parent instanceof PostEntryMetadata) {
                resolve(parent.children);
            } else {
                resolve([]);
            }
        });
    }

    getParent(el: PostTreeViewItem) {
        return el instanceof PostMetadata ? el.parent : undefined;
    }

    readonly onDidChangeTreeData: Event<PostTreeViewItem | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    getTreeItem(item: PostTreeViewItem): TreeItem | Thenable<TreeItem> {
        if (item instanceof TreeItem) {
            return item;
        }

        if (item instanceof Post) {
            const descDatePublished = item.datePublished ? `  \n发布于: ${item.datePublished}` : '';
            const localPath = PostFileMapManager.getFilePath(item.id);
            const localPathForDesc = localPath?.replace(homedir(), '~') || '未关联本地文件';
            const descLocalPath = localPath ? `  \n本地路径: ${localPathForDesc}` : '';
            let url = item.url;
            url = url.startsWith('//') ? `https:${url}` : url;
            return Object.assign(new TreeItem(`${item.title}`, TreeItemCollapsibleState.Collapsed), {
                id: `${item.id}`,
                tooltip: new MarkdownString(`[${url}](${url})` + descDatePublished + descLocalPath),
                command: {
                    command: `${globalState.extensionName}.edit-post`,
                    arguments: [item.id],
                    title: '编辑博文',
                },
                contextValue: PostFileMapManager.getFilePath(item.id) !== undefined ? 'cnb-post-cached' : 'cnb-post',
                iconPath: new ThemeIcon(item.isMarkdown ? 'markdown' : 'file-code'),
                description: localPath ? localPathForDesc : '',
                resourceUri: Uri.joinPath(Settings.workspaceUri, item.title + (item.isMarkdown ? '.md' : '.html')),
            } as TreeItem);
        } else {
            return item.toTreeItem();
        }
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

    fireTreeDataChangedEvent(post: PostTreeViewItem | undefined) {
        this._onDidChangeTreeData.fire(post);
    }
}

export const postsDataProvider = PostsDataProvider.instance;
