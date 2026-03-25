import { Checkbox, Label, Stack } from '@fluentui/react'
import { Component } from 'react'
import { PostCat } from '@/model/post-cat'

type Props = {
    userCats: PostCat[]
    selectedCatIds: number[]
    onChange: (categoryIds: number[]) => void
}

type State = { selectedCatIds: number[] }

type TreeNode = {
    cat: PostCat
    depth: number
}

export class CatSelect extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { selectedCatIds: this.props.selectedCatIds }
    }

    override componentDidUpdate(prevProps: Props) {
        if (prevProps.selectedCatIds !== this.props.selectedCatIds)
            this.setState({ selectedCatIds: this.props.selectedCatIds })
    }

    render() {
        const nodes = this.buildTreeNodes()

        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Label styles={{ root: { paddingTop: 0 } }}>分类</Label>
                <Stack tokens={{ childrenGap: 6 }}>
                    {nodes.map(({ cat, depth }) => {
                        const isChecked = this.state.selectedCatIds.includes(cat.categoryId)
                        return (
                            <Stack
                                key={cat.categoryId}
                                horizontal
                                verticalAlign="center"
                                styles={{ root: { paddingLeft: depth * 16 } }}
                            >
                                <Checkbox
                                    label={cat.title}
                                    checked={isChecked}
                                    onChange={(_, checked) => this.onCheckboxChange(cat.categoryId, checked === true)}
                                />
                            </Stack>
                        )
                    })}
                </Stack>
            </Stack>
        )
    }

    private onCheckboxChange(categoryId: number, checked: boolean) {
        const selectedCatIds = checked
            ? this.state.selectedCatIds.includes(categoryId)
                ? this.state.selectedCatIds
                : [...this.state.selectedCatIds, categoryId]
            : this.state.selectedCatIds.filter(x => x !== categoryId)

        this.setState({ selectedCatIds })
        this.props.onChange(selectedCatIds)
    }

    private buildTreeNodes(): TreeNode[] {
        const allCats = this.props.userCats.map(cat => Object.assign(new PostCat(), cat))
        const nodeMap = new Map<number, PostCat>()
        allCats.forEach(cat => {
            cat.children = []
            nodeMap.set(cat.categoryId, cat)
        })

        const roots: PostCat[] = []
        allCats.forEach(cat => {
            if (cat.parentId == null) {
                roots.push(cat)
                return
            }

            const parent = nodeMap.get(cat.parentId)
            if (parent == null) {
                roots.push(cat)
                return
            }

            cat.parent = parent
            parent.children?.push(cat)
        })

        const sortCats = (cats: PostCat[]) =>
            cats.sort((x, y) => {
                const order1 = x.order ?? Number.MAX_SAFE_INTEGER
                const order2 = y.order ?? Number.MAX_SAFE_INTEGER
                if (order1 !== order2) return order1 - order2
                return x.title.localeCompare(y.title)
            })

        const result: TreeNode[] = []
        const walk = (cats: PostCat[], depth: number) => {
            for (const cat of sortCats(cats)) {
                result.push({ cat, depth })
                if (cat.children != null && cat.children.length > 0) walk(cat.children, depth + 1)
            }
        }

        walk(sortCats(roots), 0)
        return result
    }
}
