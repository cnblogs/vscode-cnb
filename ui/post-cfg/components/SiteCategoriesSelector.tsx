import { ActionButton, Checkbox, Label, Stack } from '@fluentui/react'
import { SiteCategories } from '@models/site-category'
import React from 'react'
import { siteCategoriesStore } from '../services/site-categories-store'

export interface ISiteCategoriesSelectorProps {
    categoryIds?: number[]
    onChange?: (siteCategoryId: number) => void
}

export interface ISiteCategoriesSelectorState {
    siteCategories: SiteCategories
    isCollapsed: boolean
    categoryIds: number[]
    categoryExpandState: { [key: number]: boolean | undefined }
}

export class SiteCategoriesSelector extends React.Component<
    ISiteCategoriesSelectorProps,
    ISiteCategoriesSelectorState
> {
    constructor(props: ISiteCategoriesSelectorProps) {
        super(props)

        const siteCategories = siteCategoriesStore.get()
        const categoryExpandState: { selectedParentCategoryId?: boolean } = {}
        let selectedParentCategoryId = -1
        if (props.categoryIds && props.categoryIds.length > 0) {
            selectedParentCategoryId =
                siteCategories.find(x => x.children.find(child => child.id === props.categoryIds?.[0]))?.id ?? -1
        }
        if (selectedParentCategoryId > 0) categoryExpandState.selectedParentCategoryId = true

        this.state = {
            siteCategories: siteCategories,
            isCollapsed: true,
            categoryIds: props.categoryIds ?? [],
            categoryExpandState,
        }
    }

    render() {
        const { siteCategories, categoryIds } = this.state
        const group = siteCategories.map(parent => {
            const { children, id: parentId } = parent
            const { categoryExpandState } = this.state
            const isParentExpanded = !!categoryExpandState[parentId]
            const groupItems = children.map(child => (
                <Checkbox
                    key={child.id.toString()}
                    label={child.title}
                    checked={categoryIds.includes(child.id)}
                    onChange={(_, checked) => this.onCheckboxChange(child.id, checked)}
                ></Checkbox>
            ))
            return (
                <Stack key={parentId} tokens={{ childrenGap: 12, padding: ' 0 0 0 8px' }}>
                    <Stack
                        onClick={() => {
                            categoryExpandState[parentId] = !isParentExpanded
                            this.setState({ categoryExpandState })
                        }}
                        horizontal
                        verticalAlign="center"
                    >
                        <ActionButton styles={{ root: { height: 'auto', border: 0 } }}>
                            {parent.title}
                            <ActionButton
                                styles={{ root: { height: 'auto', border: 0 } }}
                                iconProps={{ iconName: isParentExpanded ? 'SkypeCircleMinus' : 'CirclePlus' }}
                            ></ActionButton>
                        </ActionButton>
                    </Stack>
                    {this.state.categoryExpandState[parentId] ? (
                        <Stack horizontal wrap tokens={{ childrenGap: 12, padding: '0 0 4px 16px' }}>
                            {groupItems}
                        </Stack>
                    ) : (
                        <></>
                    )}
                </Stack>
            )
        })
        return (
            <Stack tokens={{ childrenGap: 16 }}>
                <Stack horizontal>
                    <ActionButton
                        styles={{
                            root: {
                                height: 'auto',
                                paddingLeft: 0,
                                borderLeft: 0,
                            },
                        }}
                        onClick={() => this.setState({ isCollapsed: !this.state.isCollapsed })}
                    >
                        <Stack horizontal tokens={{ childrenGap: 2 }} verticalAlign="center">
                            <Label
                                styles={{
                                    root: {
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                    },
                                }}
                            >
                                投稿至网站分类
                            </Label>
                            <ActionButton
                                styles={{
                                    root: {
                                        height: 'auto',
                                    },
                                }}
                                iconProps={{ iconName: this.state.isCollapsed ? 'CirclePlus' : 'SkypeCircleMinus' }}
                            />
                        </Stack>
                    </ActionButton>
                </Stack>
                {this.state.isCollapsed ? <></> : <Stack tokens={{ childrenGap: 12 }}>{group}</Stack>}
            </Stack>
        )
    }

    private onCheckboxChange(categoryId: number, checked?: boolean) {
        this.setState({ categoryIds: checked ? [categoryId] : [] })
        this.props.onChange?.apply(this, [categoryId])
    }
}
