import React, { Component } from 'react';
import { Ing } from '@models/ing';
import { IngItem } from 'ing/IngItem';
import { Stack } from '@fluentui/react';

interface IngListProps {
    ings: Ing[];
}

class IngList extends Component<IngListProps> {
    constructor(props: IngListProps) {
        super(props);
    }

    render() {
        return (
            <div className="ing-list">
                <Stack horizontal={false} className="ing-list__items" tokens={{ childrenGap: 4 }}>
                    {this.renderItems()}
                </Stack>
            </div>
        );
    }

    private renderItems() {
        return this.props.ings.map(ing => (
            <Stack.Item>
                <IngItem ing={ing} />
            </Stack.Item>
        ));
    }
}

export { IngList };
