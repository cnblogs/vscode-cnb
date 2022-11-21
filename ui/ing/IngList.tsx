import React, { Component } from 'react';
import { Ing } from '@models/ing';
import { IngItem } from 'ing/IngItem';

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
                <div></div>
                <div className="ing-list__items">{this.renderItems()}</div>
            </div>
        );
    }

    private renderItems() {
        return this.props.ings.map(ing => <IngItem ing={ing} />);
    }
}

export { IngList };
