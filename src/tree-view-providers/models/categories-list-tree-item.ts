import { PostCategory } from '../../models/post-category'
import { PostCategoryTreeItem } from './post-category-tree-item'
import { PostEntryMetadata, PostMetadata, PostTagMetadata } from './post-metadata'
import { PostTreeItem } from './post-tree-item'

export type PostCategoriesListTreeItem =
    | PostCategory
    | PostCategoryTreeItem
    | PostTreeItem
    | PostMetadata
    | PostEntryMetadata<PostTagMetadata>
