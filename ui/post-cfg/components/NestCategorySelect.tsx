import { ActionButton, Checkbox, Icon, Link, Spinner, Stack } from '@fluentui/react'
import { PostCategory } from '@/model/post-category'
import { take } from 'lodash-es'
import { PersonalCategoryStore } from 'post-cfg/service/personal-category-store'
import React from 'react'

export type INestCategoriesSelectProps = {
    selected?: number[]
    parent?: number | null
    onSelect?: (value: number[]) => void
    level?: number
}

export type INestCategoriesSelectState = {
    expanded?: Set<number> | null
    children?: PostCategory[]
    showAll?: boolean
    limit: number
}

export default class NestCategorySelect extends React.Component<
    INestCategoriesSelectProps,
    INestCategoriesSelectState
> {
    constructor(props: INestCategoriesSelectProps) {
        super(props)

        this.state = {
            limit: 10,
        }
    }

    get isRoot(): boolean {
        return this.props.parent == null
    }

    render() {
        if (this.props.parent !== null && this.props.parent !== undefined && !this.state.children) {
            PersonalCategoryStore.getByParent(this.props.parent)
                .then(v => this.setState({ children: v }))
                .catch(console.warn)
            return <Spinner />
        }

        const categories = this.isRoot ? PersonalCategoryStore.get() : this.state.children ?? []
        return (
            <Stack tokens={{ childrenGap: 10 }}>
                {(this.state.showAll === true ? categories : take(categories, this.state.limit)).map(c => (
                    <div style={{ paddingLeft: `calc(10px * ${this.props.level ?? 0})` }}>
                        <Stack tokens={{ childrenGap: 10 }}>
                            <Stack horizontal>
                                <CategoryCheckbox
                                    isChecked={this.props.selected?.includes(c.categoryId) ?? false}
                                    category={c}
                                    onChange={isChecked => {
                                        const selected = this.props.selected ?? []
                                        this.props.onSelect?.(
                                            isChecked
                                                ? Array.from(new Set([...selected, c.categoryId]))
                                                : selected.filter(x => x !== c.categoryId)
                                        )
                                    }}
                                ></CategoryCheckbox>
                                {/* Button used toggle expand/collapse status */}
                                {c.childCount > 0 ? (
                                    <ActionButton
                                        onClick={() => this.onToggleExpandStatus(c)}
                                        styles={{
                                            root: {
                                                height: 'auto',
                                            },
                                        }}
                                        iconProps={{
                                            iconName: this.checkIsExpanded(c) ? 'SkypeCircleMinus' : 'CirclePlus',
                                        }}
                                    />
                                ) : (
                                    <></>
                                )}
                            </Stack>

                            {this.checkIsExpanded(c) ? (
                                <NestCategorySelect
                                    parent={c.categoryId}
                                    level={(this.props.level ?? 0) + 1}
                                    selected={this.props.selected}
                                    onSelect={this.props.onSelect}
                                ></NestCategorySelect>
                            ) : (
                                <></>
                            )}
                        </Stack>
                    </div>
                ))}

                {this.isRoot ? (
                    <div>
                        <Link
                            onClick={() => this.setState({ showAll: this.state.showAll !== true })}
                            style={{ height: 'auto', padding: 0, fontSize: '14px' }}
                        >
                            <Stack horizontal tokens={{ childrenGap: 0 }} verticalAlign="center">
                                <Icon
                                    iconName={this.state.showAll === true ? 'DoubleChevronUp12' : 'DoubleChevronDown12'}
                                    style={{ margin: 0, fontSize: '12px' }}
                                />
                                <span>&nbsp;{this.state.showAll === true ? '收起' : '展开'}</span>
                            </Stack>
                        </Link>
                    </div>
                ) : (
                    <></>
                )}
            </Stack>
        )
    }

    private onToggleExpandStatus(category: PostCategory) {
        const isExpanded = this.checkIsExpanded(category)

        let expandedSet = this.state.expanded

        if (isExpanded) {
            expandedSet?.delete(category.categoryId)
        } else {
            expandedSet ??= new Set()
            expandedSet.add(category.categoryId)
        }

        this.setState({ expanded: expandedSet && expandedSet.size > 0 ? new Set(expandedSet) : null })
        expandedSet?.clear()
    }

    private checkIsExpanded(category: PostCategory): boolean {
        return this.state.expanded?.has(category.categoryId) ?? false
    }
}

export type ICategoryItemProps = {
    category: PostCategory
    onChange: (isChecked: boolean) => void
    isChecked: boolean
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function CategoryCheckbox({ category, onChange, isChecked }: ICategoryItemProps) {
    return (
        <Checkbox
            label={category.title}
            checked={isChecked}
            onChange={(_, isChecked) => onChange(isChecked ?? false)}
        ></Checkbox>
    )
}
