export class PostCategory {
    categoryId: number = -1;
    title: string = '';
    visible: boolean = true;
    description: string = '';
    updateTime: Date = new Date();
    count: number = 0;
    order?: number;
}

export type PostCategoryAddDto = Pick<PostCategory, 'title' | 'visible' | 'description'>;
export type PostCategoryUpdateDto = Pick<
    PostCategory,
    'categoryId' | 'description' | 'count' | 'title' | 'order' | 'visible'
>;

export type PostCategories = PostCategory[];
