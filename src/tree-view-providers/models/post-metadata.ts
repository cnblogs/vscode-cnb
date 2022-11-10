import { format, differenceInYears, formatDistanceStrict, differenceInSeconds } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { Post } from '../../models/post';
import { PostEditDto } from '../../models/post-edit-dto';
import { postCategoryService } from '../../services/post-category.service';
import { postService } from '../../services/post.service';
import { BaseEntryTreeItem } from './base-entry-tree-item';
import { BaseTreeItemSource } from './base-tree-item-source';
import { PostTreeItem } from './post-tree-item';

export enum RootPostMetadataType {
    categoryEntry = 'categoryEntry',
    tagEntry = 'tagEntry',
    updateDate = 'updateDate',
    createDate = 'createDate',
}

const rootMetadataMap = (parsedPost: Post, postEditDto: PostEditDto | undefined) =>
    [
        [
            RootPostMetadataType.updateDate,
            () => (parsedPost.hasUpdates ? new PostUpdatedDateMetadata(parsedPost) : null),
        ],
        [RootPostMetadataType.createDate, () => new PostCreatedDateMetadata(parsedPost)],
        [
            RootPostMetadataType.categoryEntry,
            () =>
                PostCategoryMetadata.parse(parsedPost, postEditDto).then<PostMetadata | null, null>(
                    x => (x.length <= 0 ? null : new PostCategoryEntryMetadata(parsedPost, x)),
                    () => null
                ),
        ],
        [
            RootPostMetadataType.tagEntry,
            () =>
                PostTagMetadata.parse(parsedPost, postEditDto).then<PostMetadata | null, null>(
                    x => (x.length <= 0 ? null : new PostTagEntryMetadata(parsedPost, x)),
                    () => null
                ),
        ],
    ] as const;

export abstract class PostMetadata extends BaseTreeItemSource {
    constructor(public parent: Post) {
        super();
    }

    static async parseRoots({
        exclude = [],
        post,
    }: {
        post: Post | PostTreeItem;
        exclude?: RootPostMetadataType[];
    }): Promise<PostMetadata[]> {
        let parsedPost = post instanceof PostTreeItem ? post.post : post;
        const postEditDto = await postService.fetchPostEditDto(parsedPost.id);
        parsedPost = postEditDto?.post || parsedPost;
        return Promise.all(
            rootMetadataMap(parsedPost, postEditDto)
                .filter(([type]) => !exclude.includes(type))
                .map(([, factory]) => factory())
                .map(x => (x instanceof Promise ? x : Promise.resolve(x)))
        ).then(v => v.filter((x): x is PostMetadata => x instanceof PostMetadata));
    }

    abstract toTreeItem(): TreeItem | Promise<TreeItem>;
}

export abstract class PostEntryMetadata<T extends PostMetadata = PostMetadata>
    extends PostMetadata
    implements BaseEntryTreeItem<T>
{
    constructor(parent: Post, public readonly children: T[]) {
        super(parent);
    }

    readonly getChildren = () => this.children;
    readonly getChildrenAsync = () => Promise.resolve(this.children);
}

export class PostCategoryEntryMetadata extends PostEntryMetadata<PostCategoryMetadata> {
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

export class PostTagEntryMetadata extends PostEntryMetadata<PostTagMetadata> {
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

export class PostCategoryMetadata extends PostMetadata {
    readonly icon = new ThemeIcon('vscode-cnb-folder-close');
    constructor(parent: Post, public categoryName: string, public categoryId: number) {
        super(parent);
    }

    static async parse(parent: Post, editDto?: PostEditDto): Promise<PostCategoryMetadata[]> {
        editDto = editDto ? editDto : await postService.fetchPostEditDto(parent.id);
        if (editDto == null) return [];

        const {
            post: { categoryIds },
        } = editDto;
        return (await postCategoryService.findCategories(categoryIds ?? [])).map(
            ({ categoryId, title }) => new PostCategoryMetadata(parent, title, categoryId)
        );
    }

    toTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(this.categoryName), {
            iconPath: this.icon,
        });
}

export class PostTagMetadata extends PostMetadata {
    readonly icon = undefined;
    constructor(parent: Post, public tag: string, public tagId?: string) {
        super(parent);
    }

    static async parse(parent: Post, editDto?: PostEditDto): Promise<PostMetadata[]> {
        editDto = editDto ? editDto : await postService.fetchPostEditDto(parent.id);
        if (editDto == null) return [];

        const {
            post: { tags },
        } = editDto;
        return (tags ?? [])?.map(tag => new PostTagMetadata(parent, tag));
    }

    toTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(`# ${this.tag}`), {
            iconPath: this.icon,
        });
}

export abstract class PostDateMetadata extends PostMetadata {
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

export class PostCreatedDateMetadata extends PostDateMetadata {
    constructor(parent: Post) {
        super('创建于', parent, parent.datePublished ?? new Date());
    }
}

export class PostUpdatedDateMetadata extends PostDateMetadata {
    constructor(parent: Post) {
        super('更新于', parent, parent.dateUpdated ?? new Date());
    }

    get enabled(): boolean {
        const { datePublished, dateUpdated } = this.parent;
        const now = new Date();
        return differenceInSeconds(dateUpdated ?? now, datePublished ?? now) > 0;
    }
}
