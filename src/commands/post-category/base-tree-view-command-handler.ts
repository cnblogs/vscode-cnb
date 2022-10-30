import { PostCategory } from '../../models/post-category';
import { PostCategoriesListTreeItem } from '../../tree-view-providers/models/categories-list-tree-item';
import { PostCategoryTreeItem } from '../../tree-view-providers/models/post-category-tree-item';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';
import { MultiSelectableTreeViewCommandHandler, TreeViewCommandHandler } from '../command-handler';

export abstract class BasePostCategoryTreeViewCommandHandler implements TreeViewCommandHandler<PostCategory> {
    protected readonly view = extensionViews.postCategoriesList;

    constructor(public readonly input: unknown) {}

    abstract handle(): void | Promise<void>;

    parseInput(): PostCategory | null {
        const { input } = this;
        if (input instanceof PostCategory || input instanceof PostCategoryTreeItem) {
            const category = input instanceof PostCategoryTreeItem ? input.category : input;
            this.view.reveal(input).then(undefined, undefined);
            return category;
        }

        return null;
    }
}

export abstract class BaseMultiSelectablePostCategoryTreeViewCommandHandler extends MultiSelectableTreeViewCommandHandler<
    PostCategoriesListTreeItem,
    PostCategory
> {
    protected get view() {
        return extensionViews.postCategoriesList;
    }

    protected parseSelections() {
        const categories =
            this.view?.selection
                .map(x => (x instanceof PostCategoryTreeItem ? x.category : x instanceof PostCategory ? x : null))
                .filter((x): x is PostCategory => x != null) ?? [];
        const inputCategory =
            this.input instanceof PostCategoryTreeItem
                ? this.input.category
                : this.input instanceof PostCategory
                ? this.input
                : null;
        if (inputCategory && !categories.find(x => x.categoryId === inputCategory.categoryId))
            categories.unshift(inputCategory);

        return categories;
    }
}
