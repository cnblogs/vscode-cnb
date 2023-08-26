import { PostCat } from '@/model/post-category'
import { toTreeItem } from '@/tree-view/convert'
import { BaseTreeItemSource } from './base-tree-item-source'
import { PostTreeItem } from './post-tree-item'

export class PostCatTreeItem extends BaseTreeItemSource {
    constructor(
        public readonly category: PostCat,
        public children: (PostCatTreeItem | PostTreeItem)[] = []
    ) {
        super()
    }

    toTreeItem = () => toTreeItem(this.category)
}
