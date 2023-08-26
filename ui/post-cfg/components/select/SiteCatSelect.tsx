import { ActionButton, Checkbox, Label, Stack } from '@fluentui/react'
import { SiteCategory } from '@/model/site-category'
import React, { Component } from 'react'

type Props = {
    catIds: number[]
    siteCats: SiteCategory[]
    onChange: (siteCategoryId: number) => void
}

type State = {
    isCollapsed: boolean
    catIds: number[]
    catExpandState: { [key: number]: boolean | undefined }
}

export class SiteCatSelect extends Component<Props, State> {
    constructor(props: Props) {
        super(props)

        const catExpandState: { selectedParentCategoryId?: boolean } = {}
        let selectedParentCategoryId = -1
        if (props.catIds.length > 0) {
            selectedParentCategoryId =
                this.props.siteCats.find(x => x.children.find(child => child.id === props.catIds?.[0]))?.id ?? -1
        }
        if (selectedParentCategoryId > 0) catExpandState.selectedParentCategoryId = true

        this.state = {
            isCollapsed: true,
            catIds: this.props.catIds,
            catExpandState,
        }
    }

    render() {
        const { siteCats } = this.props
        const { catIds } = this.state
        const group = siteCats.map(parent => {
            const { children, id: parentId } = parent
            const { catExpandState } = this.state
            const isParentExpanded = catExpandState[parentId] === true
            const groupItems = children.map(child => (
                <Checkbox
                    key={child.id.toString()}
                    label={child.title}
                    checked={catIds.includes(child.id)}
                    onChange={(_, checked) => this.onCheckboxChange(child.id, checked)}
                ></Checkbox>
            ))
            return (
                <Stack key={parentId} tokens={{ childrenGap: 12, padding: ' 0 0 0 8px' }}>
                    <Stack
                        onClick={() => {
                            catExpandState[parentId] = !isParentExpanded
                            this.setState({ catExpandState })
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
                    {this.state.catExpandState[parentId] === true ? (
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

    private onCheckboxChange(categoryId: number, checked = false) {
        this.setState({ catIds: checked ? [categoryId] : [] })
        this.props.onChange(categoryId)
    }
}
