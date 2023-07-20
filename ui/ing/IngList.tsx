import React, { Component } from 'react'
import { Ing, IngComment } from '@models/ing'
import { IngItem } from 'ing/IngItem'
import { Stack } from '@fluentui/react'

interface IngListProps {
    ings: Ing[]
    comments: Record<number, IngComment[]>
}

class IngList extends Component<IngListProps> {
    constructor(props: IngListProps) {
        super(props)
    }

    render() {
        return (
            <div className="ing-list">
                <Stack horizontal={false} className="ing-list__items" tokens={{ childrenGap: 8 }}>
                    {this.renderItems()}
                </Stack>
            </div>
        )
    }

    private renderItems() {
        const { comments } = this.props
        return this.props.ings.map(ing => (
            <Stack.Item>
                <IngItem ing={ing} comments={comments[ing.id]} />
            </Stack.Item>
        ))
    }
}

export { IngList }
