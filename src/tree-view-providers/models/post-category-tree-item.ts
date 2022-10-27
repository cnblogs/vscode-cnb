import { TreeItem } from 'vscode';
import { PostCategory } from '../../models/post-category';
import { toTreeItem } from '../converters';
import { BaseTreeItemSource } from './base-tree-item-source';
import { PostTreeItem } from './post-tree-item';

export class PostCategoryTreeItem extends BaseTreeItemSource {
    constructor(public readonly category: PostCategory, public children?: PostTreeItem<PostCategoryTreeItem>[]) {
        super();
    }

    toTreeItem = (): TreeItem | Promise<TreeItem> => toTreeItem(this.category);
}
