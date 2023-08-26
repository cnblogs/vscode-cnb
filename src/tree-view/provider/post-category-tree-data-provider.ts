import { flattenDepth, take } from 'lodash-es'
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode'
import { PostCatService } from '@/service/post/post-cat'
import { PostService } from '@/service/post/post'
import { toTreeItem } from '@/tree-view/convert'
import { PostCatListTreeItem } from '@/tree-view/model/category-list-tree-item'
import { PostCatTreeItem } from '@/tree-view/model/post-category-tree-item'
import { PostEntryMetadata, PostMetadata, RootPostMetadataType } from '@/tree-view/model/post-metadata'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { Alert } from '@/infra/alert'
import { setCtx } from '@/ctx/global-ctx'

export class PostCatTreeDataProvider implements TreeDataProvider<PostCatListTreeItem> {
    private _treeDataChanged = new EventEmitter<PostCatListTreeItem | null | undefined>()
    private _isLoading = false
    private _roots: PostCatTreeItem[] | null = null

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
                    x => x.children?.filter((c): c is PostTreeItem<PostCatTreeItem> => c instanceof PostTreeItem) ?? []
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

    getTreeItem(el: PostCatListTreeItem): TreeItem | Thenable<TreeItem> {
        return toTreeItem(el)
    }

    getChildren(item?: PostCatListTreeItem): ProviderResult<PostCatListTreeItem[]> {
        if (this.isLoading) return Promise.resolve([])

        if (item === undefined) {
            return PostCatService.getAll().then(list => list.map(c => new PostCatTreeItem(c)))
        } else if (item instanceof PostCatTreeItem) {
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

    getParent = (el: any) => el.parent as PostCatListTreeItem | null | undefined

    fireTreeDataChangedEvent(item?: PostCatListTreeItem) {
        this._treeDataChanged.fire(item)
    }

    refresh() {
        this._roots = null
        this.fireTreeDataChangedEvent()
    }

    onPostUpdated({ refreshPost = false, postIds }: { postIds: number[]; refreshPost?: boolean }) {
        const postTreeItems = this.flattenPostItems.filter(x => postIds.includes(x.post.id))
        const categories = new Set<PostCatTreeItem>()
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

    private async getPost(parent: PostCatTreeItem): Promise<PostTreeItem[]> {
        const catId = parent.category.categoryId

        const data = await PostService.search(1, 100, undefined, catId)
        const postList = data.page.items
        const arr = postList.map(x =>
            Object.assign(new PostTreeItem<PostCatTreeItem>(x, true), {
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
            const categories = await PostCatService.getAllUnder(parentId)
            await this.setIsRefreshing(false)
            return categories.map(x => new PostCatTreeItem(x))
        } catch (e) {
            void Alert.err(`获取博文分类失败: ${<string>e}`)
            await this.setIsRefreshing(false)
            throw e
        }
    }
}

export const postCategoryDataProvider = new PostCatTreeDataProvider()
