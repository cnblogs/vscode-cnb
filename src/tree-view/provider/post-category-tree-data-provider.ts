import { flattenDepth, take } from 'lodash-es'
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { PostCategoryService } from '@/service/post/post-category'
import { PostService } from '@/service/post/post'
import { toTreeItem } from '@/tree-view/convert'
import { PostCategoriesListTreeItem } from '@/tree-view/model/category-list-tree-item'
import { PostCategoryTreeItem } from '@/tree-view/model/post-category-tree-item'
import { PostEntryMetadata, PostMetadata, RootPostMetadataType } from '@/tree-view/model/post-metadata'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { Alert } from '@/infra/alert'
import { setCtx } from '@/ctx/global-ctx'

export class PostCategoryTreeDataProvider implements TreeDataProvider<PostCategoriesListTreeItem> {
    private _treeDataChanged = new EventEmitter<PostCategoriesListTreeItem | null | undefined>()
    private _isLoading = false
    private _roots: PostCategoryTreeItem[] | null = null

    get isLoading() {
        return this._isLoading
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
        await setCtx('post-cat-list.isLoading', value)
        this._isLoading = value
    }

    getTreeItem(el: PostCategoriesListTreeItem): TreeItem | Thenable<TreeItem> {
        return toTreeItem(el)
    }

    getChildren(item?: PostCategoriesListTreeItem): ProviderResult<PostCategoriesListTreeItem[]> {
        if (this.isLoading) return Promise.resolve([])

        if (item === undefined) {
            return PostCategoryService.getAll().then(list => list.map(c => new PostCategoryTreeItem(c)))
        } else if (item instanceof PostCategoryTreeItem) {
            const categoryId = item.category.categoryId
            return Promise.all([this.getCategories(categoryId), this.getPost(item)]).then(
                ([childCategories, childPost]) => (item.children = [...childCategories, ...childPost])
            )
        } else if (item instanceof PostTreeItem) {
            return this.getPostMetadataChildren(item)
        } else if (item instanceof PostEntryMetadata) {
            return item.getChildrenAsync()
        }

        return Promise.resolve([])
    }

    getParent = (el: any) => el.parent as PostCategoriesListTreeItem | null | undefined

    fireTreeDataChangedEvent(item?: PostCategoriesListTreeItem) {
        this._treeDataChanged.fire(item)
    }

    refresh() {
        this._roots = null
        this.fireTreeDataChangedEvent()
    }

    onPostUpdated({ refreshPost = false, postIds }: { postIds: number[]; refreshPost?: boolean }) {
        const postTreeItems = this.flattenPostItems.filter(x => postIds.includes(x.post.id))
        const categories = new Set<PostCategoryTreeItem>()
        postTreeItems.forEach(treeItem => {
            if (treeItem.parent === undefined) return

            if (refreshPost) treeItem.parent.children = []
            else this.fireTreeDataChangedEvent(treeItem)

            if (!categories.has(treeItem.parent)) {
                categories.add(treeItem.parent)
                this.fireTreeDataChangedEvent(treeItem.parent)
            }
        })
    }

    private async getPost(parent: PostCategoryTreeItem): Promise<PostTreeItem[]> {
        const catId = parent.category.categoryId

        const data = await PostService.search(1, 100, undefined, catId)
        const postList = data.page.items
        const arr = postList.map(x =>
            Object.assign(new PostTreeItem<PostCategoryTreeItem>(x, true), {
                parent,
            })
        )

        return take(arr, 500)
    }

    private getPostMetadataChildren(parent: PostTreeItem) {
        return PostMetadata.parseRoots({ post: parent, exclude: [RootPostMetadataType.categoryEntry] })
    }

    private async getCategories(parentId: number) {
        await this.setIsRefreshing(true)
        try {
            const categories = await PostCategoryService.getAllUnder(parentId)
            await this.setIsRefreshing(false)
            return categories.map(x => new PostCategoryTreeItem(x))
        } catch (e) {
            void Alert.err(`获取博文分类失败: ${<string>e}`)
            await this.setIsRefreshing(false)
            throw e
        }
    }
}

export const postCategoryDataProvider = new PostCategoryTreeDataProvider()
