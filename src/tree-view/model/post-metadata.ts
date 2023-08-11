import differenceInSeconds from 'date-fns/differenceInSeconds'
import differenceInYears from 'date-fns/differenceInYears'
import format from 'date-fns/format'
import formatDistanceStrict from 'date-fns/formatDistanceStrict'
import zhCN from 'date-fns/locale/zh-CN'
import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode'
import { AccessPermission, Post, formatAccessPermission } from '@/model/post'
import { PostEditDto } from '@/model/post-edit-dto'
import { PostCategoryService } from '@/service/post/post-category'
import { PostService } from '@/service/post/post'
import { BaseEntryTreeItem } from './base-entry-tree-item'
import { BaseTreeItemSource } from './base-tree-item-source'
import { PostTreeItem } from './post-tree-item'
import { PostCategory } from '@/model/post-category'

export enum RootPostMetadataType {
    categoryEntry = 'categoryEntry',
    tagEntry = 'tagEntry',
    updateDate = 'updateDate',
    createDate = 'createDate',
    publishStatus = 'publishStatus',
    accessPermission = 'accessPermission',
}

const rootMetadataMap = (parsedPost: Post, postEditDto: PostEditDto | undefined) =>
    [
        [
            RootPostMetadataType.updateDate,
            () => (parsedPost.hasUpdates ? new PostUpdatedDateMetadata(parsedPost) : null),
        ],
        [RootPostMetadataType.createDate, () => new PostCreatedDateMetadata(parsedPost)],
        [RootPostMetadataType.publishStatus, () => new PostPublishStatusMetadata(parsedPost)],
        [RootPostMetadataType.accessPermission, () => new PostAccessPermissionMetadata(parsedPost)],
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
    ] as const

export abstract class PostMetadata extends BaseTreeItemSource {
    protected constructor(public parent: Post) {
        super()
    }

    static async parseRoots({
        exclude = [],
        post,
    }: {
        post: Post | PostTreeItem
        exclude?: RootPostMetadataType[]
    }): Promise<PostMetadata[]> {
        let parsedPost = post instanceof PostTreeItem ? post.post : post
        const postEditDto = await PostService.fetchPostEditDto(parsedPost.id)
        parsedPost = postEditDto?.post || parsedPost
        return Promise.all(
            rootMetadataMap(parsedPost, postEditDto)
                .filter(([type]) => !exclude.includes(type))
                .map(([, factory]) => factory())
                .map(x => (x instanceof Promise ? x : Promise.resolve(x)))
        ).then(v => v.filter((x): x is PostMetadata => x instanceof PostMetadata))
    }

    abstract toTreeItem(): TreeItem | Promise<TreeItem>
}

export abstract class PostEntryMetadata<T extends PostMetadata = PostMetadata>
    extends PostMetadata
    implements BaseEntryTreeItem<T>
{
    constructor(
        parent: Post,
        public readonly children: T[]
    ) {
        super(parent)
    }

    readonly getChildren = () => this.children
    readonly getChildrenAsync = () => Promise.resolve(this.children)
}

export class PostCategoryEntryMetadata extends PostEntryMetadata<PostCategoryMetadata> {
    constructor(parent: Post, children: PostMetadata[]) {
        super(
            parent,
            children.filter((x): x is PostCategoryMetadata => x instanceof PostCategoryMetadata)
        )
    }

    toTreeItem = (): TreeItem => ({
        label: '分类',
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        iconPath: new ThemeIcon('vscode-cnb-folders'),
    })
}

export class PostTagEntryMetadata extends PostEntryMetadata<PostTagMetadata> {
    constructor(parent: Post, children: PostMetadata[]) {
        super(
            parent,
            children.filter((x): x is PostTagMetadata => x instanceof PostTagMetadata)
        )
    }

    toTreeItem = (): TreeItem => ({
        label: '标签',
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        iconPath: new ThemeIcon('tag'),
    })
}

export class PostCategoryMetadata extends PostMetadata {
    readonly icon = new ThemeIcon('vscode-cnb-folder-close')

    constructor(
        parent: Post,
        public categoryName: string,
        public categoryId: number
    ) {
        super(parent)
    }

    static async parse(parent: Post, editDto?: PostEditDto): Promise<PostCategoryMetadata[]> {
        editDto = editDto ? editDto : await PostService.fetchPostEditDto(parent.id)
        if (editDto == null) return []

        const categoryIds = editDto.post.categoryIds ?? []
        const futList = categoryIds.map(PostCategoryService.getOne)
        const categoryList = await Promise.all(futList)

        return categoryList
            .filter((x): x is PostCategory => x != null)
            .map(
                category =>
                    new PostCategoryMetadata(
                        parent,
                        category
                            .flattenParents()
                            .map(({ title }) => title)
                            .join('/'),
                        category.categoryId
                    )
            )
    }

    toTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(this.categoryName), {
            iconPath: this.icon,
        })
}

export class PostTagMetadata extends PostMetadata {
    readonly icon = undefined

    constructor(
        parent: Post,
        public tag: string,
        public tagId?: string
    ) {
        super(parent)
    }

    static async parse(parent: Post, editDto?: PostEditDto): Promise<PostMetadata[]> {
        editDto = editDto ? editDto : await PostService.fetchPostEditDto(parent.id)
        if (editDto == null) return []

        const {
            post: { tags },
        } = editDto
        return (tags ?? [])?.map(tag => new PostTagMetadata(parent, tag))
    }

    toTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(`# ${this.tag}`), {
            iconPath: this.icon,
        })
}

export abstract class PostDateMetadata extends PostMetadata {
    readonly distance: string

    constructor(
        public label: string,
        parent: Post,
        public readonly date: Date
    ) {
        super(parent)
        this.distance = this.toDistance()
    }

    get enabled(): boolean {
        return true
    }

    get formattedDate(): string {
        return format(this.date, 'yyyy MM-dd HH:mm')
    }

    shouldUseDistance = (): boolean => differenceInYears(new Date(), this.date) < 1
    toDistance = () => formatDistanceStrict(this.date, new Date(), { addSuffix: true, locale: zhCN })

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
        )
}

export class PostCreatedDateMetadata extends PostDateMetadata {
    constructor(parent: Post) {
        super('创建于', parent, parent.datePublished ?? new Date())
    }
}

export class PostUpdatedDateMetadata extends PostDateMetadata {
    constructor(parent: Post) {
        super('更新于', parent, parent.dateUpdated ?? new Date())
    }

    get enabled(): boolean {
        const { datePublished, dateUpdated } = this.parent
        const now = new Date()
        return differenceInSeconds(dateUpdated ?? now, datePublished ?? now) > 0
    }
}

export class PostAccessPermissionMetadata extends PostMetadata {
    constructor(public readonly parent: Post) {
        super(parent)
    }

    static parseIcon(accessPermission: AccessPermission, requirePassword: boolean) {
        if (requirePassword) return new ThemeIcon('key')

        switch (accessPermission) {
            case AccessPermission.undeclared:
                return new ThemeIcon('globe')
            case AccessPermission.authenticated:
                return new ThemeIcon('public-ports-view-icon')
            default:
                return new ThemeIcon('private-ports-view-icon')
        }
    }

    toTreeItem(): Promise<TreeItem> {
        const { password } = this.parent
        const isPasswordRequired = password != null && password.length > 0
        return Promise.resolve(
            Object.assign<TreeItem, Partial<TreeItem>>(
                new TreeItem(
                    `访问权限: ${formatAccessPermission(this.parent.accessPermission)}` +
                        (isPasswordRequired ? '(需密码)' : '')
                ),
                {
                    iconPath: PostAccessPermissionMetadata.parseIcon(this.parent.accessPermission, isPasswordRequired),
                }
            )
        )
    }
}

export class PostPublishStatusMetadata extends PostMetadata {
    constructor(public readonly parent: Post) {
        super(parent)
    }

    toTreeItem(): Promise<TreeItem> {
        const {
            parent: { isPublished, isDraft },
        } = this
        return Promise.resolve(
            Object.assign<TreeItem, Partial<TreeItem>>(
                new TreeItem(isPublished ? '已发布' : '未发布' + (isDraft ? '(草稿)' : '')),
                {
                    iconPath: new ThemeIcon(isDraft ? 'issue-draft' : isPublished ? 'issue-closed' : 'circle-slash'),
                }
            )
        )
    }
}
