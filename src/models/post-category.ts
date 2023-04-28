export class PostCategory {
    parentId?: number | null;
    categoryId = -1;
    title = '';
    visible = true;
    description = '';
    updateTime: Date = new Date();
    count = 0;
    order?: number;
    childCount = 0;
    visibleChildCount = 0;
}

export type PostCategoryAddDto = Pick<PostCategory, 'title' | 'visible' | 'description'>;
export type PostCategoryUpdateDto = Pick<
    PostCategory,
    'categoryId' | 'description' | 'count' | 'title' | 'order' | 'visible'
>;

export type PostCategories = PostCategory[];
