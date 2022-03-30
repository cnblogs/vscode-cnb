import { PostCategories } from '@models/post-category';

export namespace personalCategoriesStore {
    let items: PostCategories = [];
    export const get = (): PostCategories => items ?? [];
    export const set = (value: PostCategories) => (items = value ?? []);
}
