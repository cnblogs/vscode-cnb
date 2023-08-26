import { ComboBox } from '@fluentui/react'
import { Component } from 'react'
import { PostCat } from '@/model/post-category'

type Props = {
    allCats: PostCat[]
    selectedCatIds: number[]
    onChange: (categoryIds: number[]) => void
}
type State = { selectedCatIds: number[] }

export class CatSelect extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { selectedCatIds: this.props.selectedCatIds }
    }

    render() {
        const opts = this.props.allCats.map(cat => ({
            data: cat.categoryId,
            key: cat.categoryId,
            text: cat.title,
        }))

        return (
            <ComboBox
                label="分类"
                placeholder="点击选择"
                options={opts}
                selectedKey={this.state.selectedCatIds}
                multiSelect
                useComboBoxAsMenuWidth
                onChange={(_, opt, __, val) => {
                    if (opt !== undefined) {
                        if (val === undefined) {
                            const selectedCatIds = this.state.selectedCatIds.filter(x => x !== opt.data)
                            this.setState({ selectedCatIds })
                        } else {
                            this.state.selectedCatIds.push(opt.data as number)
                            this.setState(this.state)
                        }
                    }
                    this.props.onChange(this.state.selectedCatIds)
                }}
            />
        )
    }
}
