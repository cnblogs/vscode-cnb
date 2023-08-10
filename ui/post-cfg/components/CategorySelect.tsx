import { Checkbox, Stack } from '@fluentui/react'
import { Component } from 'react'
import { PersonalCategoryStore } from '../service/personal-category-store'
import { PostCategory } from '@/model/post-category'

interface CategoriesSelectorProps {
    categoryIds: number[] | undefined
    onChange?: (categoryIds: number[]) => void
}

interface CategoriesSelectorState {
    categories: PostCategory[]
    categoryIds: number[]
}

class CategorySelect extends Component<CategoriesSelectorProps, CategoriesSelectorState> {
    constructor(props: CategoriesSelectorProps) {
        super(props)
        this.state = { categories: PersonalCategoryStore.get(), categoryIds: props.categoryIds ?? [] }
    }

    render() {
        const { categories, categoryIds } = this.state
        const items = categories.map(category => (
            <Checkbox
                key={category.categoryId}
                onChange={(_, isChecked) => this.onCheckboxChanged(category.categoryId, isChecked)}
                label={category.title}
                checked={categoryIds?.includes(category.categoryId)}
            />
        ))
        return (
            <Stack tokens={{ childrenGap: 16 }} horizontal wrap>
                {items}
            </Stack>
        )
    }

    private onCheckboxChanged(categoryId: number, isChecked?: boolean) {
        const { categoryIds } = this.state

        const position = categoryIds.findIndex(x => x === categoryId)
        const isInclude = position >= 0
        switch (isChecked) {
            case true:
                if (!isInclude) categoryIds.push(categoryId)

                break
            default:
                if (isInclude) categoryIds.splice(position, 1)
        }
        this.props.onChange?.apply(this, [categoryIds])
    }
}

export { CategorySelect }
