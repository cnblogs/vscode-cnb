import { flattenDepth, take } from 'lodash-es'
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'
import { PostCategoryService } from '@/service/post/post-category'
import { PostService } from '@/service/post/post'
import { toTreeItem } from '@/tree-view/convert'
import { PostCategoriesListTreeItem } from '@/tree-view/model/category-list-tree-item'
import { PostCategoryTreeItem } from '@/tree-view/model/post-category-tree-item'
import { PostEntryMetadata, PostMetadata, RootPostMetadataType } from '@/tree-view/model/post-metadata'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { Alert } from '@/infra/alert'
import { execCmd } from '@/infra/cmd'
import { PostCategory } from '@/model/post-category'

export class PostCategoryTreeDataProvider implements TreeDataProvider<PostCategoriesListTreeItem> {
    private _treeDataChanged = new EventEmitter<PostCategoriesListTreeItem | null | undefined>()
    private _isRefreshing = false
    private _roots: PostCategoryTreeItem[] | null = null

    get isRefreshing() {
        return this._isRefreshing
    }

    get roots() {
        return this._roots ?? []
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
        )
    }

    get onDidChangeTreeData() {
        return this._treeDataChanged.event
    }

    async setIsRefreshing(value: boolean) {
        await execCmd('setContext', `${globalCtx.extName}.postCategoriesList.isRefreshing`, value)
        this._isRefreshing = value
    }

    getTreeItem(element: PostCategoriesListTreeItem): TreeItem | Thenable<TreeItem> {
        return toTreeItem(element)
    }

    getChildren(parent?: PostCategoriesListTreeItem): ProviderResult<PostCategoriesListTreeItem[]> {
        if (!this.isRefreshing) {
            if (parent == null) {
                return this.getCategories()
            } else if (parent instanceof PostCategoryTreeItem) {
                return Promise.all([this.getCategories(parent.category.categoryId), this.getPost(parent)]).then(
                    ([childCategories, childPost]) => (parent.children = [...childCategories, ...childPost])
                )
            } else if (parent instanceof PostTreeItem) {
                return this.getPostMetadataChildren(parent)
            } else if (parent instanceof PostEntryMetadata) {
                return parent.getChildrenAsync()
            }
        }

        return Promise.resolve([])
    }

    getParent = (el: any) => el.parent as PostCategoriesListTreeItem | null | undefined

    fireTreeDataChangedEvent(item?: PostCategoriesListTreeItem) {
        this._treeDataChanged.fire(item)
    }

    refresh() {
        this._roots = null
        this.fireTreeDataChangedEvent(undefined)
    }

    onPostUpdated({ refreshPost = false, postIds }: { postIds: number[]; refreshPost?: boolean }) {
        const postTreeItems = this.flattenPostItems.filter(x => postIds.includes(x.post.id))
        const categories = new Set<PostCategoryTreeItem>()
        postTreeItems.forEach(treeItem => {
            if (treeItem.parent) {
                if (refreshPost) treeItem.parent.children = undefined
                else this.fireTreeDataChangedEvent(treeItem)

                if (!categories.has(treeItem.parent)) {
                    categories.add(treeItem.parent)
                    this.fireTreeDataChangedEvent(treeItem.parent)
                }
            }
        })
    }

    private async getPost(parent: PostCategoryTreeItem): Promise<PostTreeItem[]> {
        const {
            category: { categoryId },
        } = parent

        const postList = await PostService.fetchPostList({ categoryId, pageSize: 100 })
        const arr = postList.items.map(x =>
            Object.assign<PostTreeItem<PostCategoryTreeItem>, Partial<PostTreeItem<PostCategoryTreeItem>>>(
                new PostTreeItem<PostCategoryTreeItem>(x, true),
                {
                    parent,
                }
            )
        )

        return take(arr, 500)
    }

    private getPostMetadataChildren(parent: PostTreeItem) {
        return PostMetadata.parseRoots({ post: parent, exclude: [RootPostMetadataType.categoryEntry] })
    }

    private async getCategories(parentId?: number | null) {
        await this.setIsRefreshing(true)
        let categories: PostCategory[] = []
        try {
            categories = await PostCategoryService.listCategories({
                forceRefresh: true,
                parentId: parentId ?? undefined,
            })
        } catch (e) {
            void Alert.err(`获取博文分类失败: ${(<Error>e).message}`)
        } finally {
            await this.setIsRefreshing(false)
        }

        return categories.map(x => new PostCategoryTreeItem(x))
    }
}

export const postCategoryDataProvider = new PostCategoryTreeDataProvider()
