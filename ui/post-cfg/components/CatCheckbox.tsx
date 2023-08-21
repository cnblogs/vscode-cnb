import { Checkbox } from '@fluentui/react'
import { PostCategory } from '@/model/post-category'
import React, { Component } from 'react'

type Props = {
    category: PostCategory
    isChecked: boolean
    onChange: (isChecked: boolean) => void
}

export class CatCheckbox extends Component<Props> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        const title = this.props.category.title
        const isChecked = this.props.isChecked
        const onChange = this.props.onChange

        return (
            <Checkbox
                label={title}
                checked={isChecked}
                onChange={(_, isChecked) => onChange(isChecked ?? false)}
            ></Checkbox>
        )
    }
}
