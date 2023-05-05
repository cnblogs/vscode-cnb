import { flattenDepth, take } from 'lodash-es';
import { commands, EventEmitter, MessageOptions, ProviderResult, TreeDataProvider, TreeItem, window } from 'vscode';
import { PostCategories } from '../models/post-category';
import { globalContext } from '../services/global-state';
import { postCategoryService } from '../services/post-category.service';
import { postService } from '../services/post.service';
import { toTreeItem } from './converters';
import { PostCategoriesListTreeItem } from './models/categories-list-tree-item';
import { PostCategoryTreeItem } from './models/post-category-tree-item';
import { PostEntryMetadata, PostMetadata, RootPostMetadataType } from './models/post-metadata';
import { PostTreeItem } from './models/post-tree-item';

export class PostCategoriesTreeDataProvider implements TreeDataProvider<PostCategoriesListTreeItem> {
    private static _instance: PostCategoriesTreeDataProvider;
    private _treeDataChanged = new EventEmitter<PostCategoriesListTreeItem | null | undefined>();
    private _isRefreshing = false;
    private _roots: PostCategoryTreeItem[] | null = null;

    private constructor() {}

    static get instance() {
        return (this._instance ??= new PostCategoriesTreeDataProvider());
    }

    get isRefreshing() {
        return this._isRefreshing;
    }

    get roots() {
        return this._roots ?? [];
    }

    get flattenPostItems() {
        return (
            flattenDepth(
                this._roots?.map(
                    x =>
                        x.children?.filter((c): c is PostTreeItem<PostCategoryTreeItem> => c instanceof PostTreeItem) ??
                        []
                ),
                1
            ) ?? []
        );
    }
    get onDidChangeTreeData() {
        return this._treeDataChanged.event;
    }

    async setIsRefreshing(value: boolean) {
        await commands.executeCommand(
            'setContext',
            `${globalContext.extensionName}.postCategoriesList.isRefreshing`,
            value
        );
        this._isRefreshing = value;
    }

    getTreeItem(element: PostCategoriesListTreeItem): TreeItem | Thenable<TreeItem> {
        return toTreeItem(element);
    }

    getChildren(parent?: PostCategoriesListTreeItem): ProviderResult<PostCategoriesListTreeItem[]> {
        if (!this.isRefreshing) {
            if (parent == null) {
                return this.getCategories();
            } else if (parent instanceof PostCategoryTreeItem) {
                return Promise.all([this.getCategories(parent.category.categoryId), this.getPosts(parent)]).then(
                    ([childCategories, childPosts]) => (parent.children = [...childCategories, ...childPosts])
                );
            } else if (parent instanceof PostTreeItem) {
                return this.getPostMetadataChildren(parent);
            } else if (parent instanceof PostEntryMetadata) {
                return parent.getChildrenAsync();
            }
        }

        return Promise.resolve([]);
    }

    getParent = (el: any) => el.parent as PostCategoriesListTreeItem | null | undefined;

    fireTreeDataChangedEvent(item?: PostCategoriesListTreeItem) {
        this._treeDataChanged.fire(item);
    }

    refresh() {
        this._roots = null;
        this.fireTreeDataChangedEvent(undefined);
    }

    onPostUpdated({ refreshPosts = false, postIds }: { postIds: number[]; refreshPosts?: boolean }) {
        const postTreeItems = this.flattenPostItems.filter(x => postIds.includes(x.post.id));
        const categories = new Set<PostCategoryTreeItem>();
        postTreeItems.forEach(treeItem => {
            if (treeItem.parent) {
                if (refreshPosts) treeItem.parent.children = undefined;
                else this.fireTreeDataChangedEvent(treeItem);

                if (!categories.has(treeItem.parent)) {
                    categories.add(treeItem.parent);
                    this.fireTreeDataChangedEvent(treeItem.parent);
                }
            }
        });
    }

    private async getPosts(parent: PostCategoryTreeItem): Promise<PostTreeItem[]> {
        const {
            category: { categoryId },
        } = parent;

        return take(
            (await postService.fetchPostsList({ categoryId, pageSize: 100 })).items.map(x =>
                Object.assign<PostTreeItem<PostCategoryTreeItem>, Partial<PostTreeItem<PostCategoryTreeItem>>>(
                    new PostTreeItem<PostCategoryTreeItem>(x, true),
                    {
                        parent,
                    }
                )
            ),
            500
        );
    }

    private getPostMetadataChildren(parent: PostTreeItem) {
        return PostMetadata.parseRoots({ post: parent, exclude: [RootPostMetadataType.categoryEntry] });
    }

    private async getCategories(parentId?: number | null) {
        await this.setIsRefreshing(true);
        let categories: PostCategories = [];
        try {
            categories = await postCategoryService.listCategories({
                forceRefresh: true,
                parentId: parentId ?? undefined,
            });
        } catch (err) {
            void window.showWarningMessage('获取博文分类失败', {
                detail: `服务器返回了错误, ${err instanceof Error ? err.message : JSON.stringify(err)}`,
            } as MessageOptions);
        } finally {
            await this.setIsRefreshing(false);
        }

        return categories.map(x => new PostCategoryTreeItem(x));
    }
}

export const postCategoriesDataProvider = PostCategoriesTreeDataProvider.instance;
