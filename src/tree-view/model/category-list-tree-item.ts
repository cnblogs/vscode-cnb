import { PostCat } from '@/model/post-category'
import { PostCatTreeItem } from './post-category-tree-item'
import { PostEntryMetadata, PostMetadata, PostTagMetadata } from './post-metadata'
import { PostTreeItem } from './post-tree-item'

export type PostCategoriesListTreeItem =
    | PostCat
    | PostCatTreeItem
    | PostTreeItem
    | PostMetadata
    | PostEntryMetadata<PostTagMetadata>
