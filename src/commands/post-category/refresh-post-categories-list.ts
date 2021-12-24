import { postCategoryService } from '../../services/post-category.service';
import { postCategoriesDataProvider } from '../../tree-view-providers/categories-view-data-provider';

export const refreshPostCategoriesList = () => {
    postCategoryService.clearCache();
    postCategoriesDataProvider.triggerTreeDataChangeEvent();
};
