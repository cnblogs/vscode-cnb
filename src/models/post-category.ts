export class PostCategory {
    categoryId: number = -1;
    title: string = '';
    visible: boolean = true;
    description: string = '';
    updateTime: Date = new Date();
    count: number = 0;
    order?: number;
}

export type PostCategories = PostCategory[];
