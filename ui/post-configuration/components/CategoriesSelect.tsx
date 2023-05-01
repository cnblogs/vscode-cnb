import { Checkbox, Stack } from '@fluentui/react';
import { PostCategories } from '@models/post-category';
import { Component } from 'react';
import { personalCategoriesStore } from '../services/personal-categories-store';

interface CategoriesSelectorProps {
    categoryIds: number[] | undefined;
    onChange?: (categoryIds: number[]) => void;
}

interface CategoriesSelectorState {
    categories: PostCategories;
    categoryIds: number[];
}

class CategoriesSelect extends Component<CategoriesSelectorProps, CategoriesSelectorState> {
    constructor(props: CategoriesSelectorProps) {
        super(props);
        this.state = { categories: personalCategoriesStore.get(), categoryIds: props.categoryIds ?? [] };
    }

    render() {
        const { categories, categoryIds } = this.state;
        const items = categories.map(category => (
            <Checkbox
                key={category.categoryId}
                onChange={(_, isChecked) => this.onCheckboxChanged(category.categoryId, isChecked)}
                label={category.title}
                checked={categoryIds?.includes(category.categoryId)}
            />
        ));
        return (
            <Stack tokens={{ childrenGap: 16 }} horizontal wrap>
                {items}
            </Stack>
        );
    }

    private onCheckboxChanged(categoryId: number, isChecked?: boolean) {
        const { categoryIds } = this.state;

        const position = categoryIds.findIndex(x => x === categoryId);
        const isInclude = position >= 0;
        switch (isChecked) {
            case true:
                if (!isInclude) categoryIds.push(categoryId);

                break;
            default:
                if (isInclude) categoryIds.splice(position, 1);
        }
        this.props.onChange?.apply(this, [categoryIds]);
    }
}

export { CategoriesSelect };
