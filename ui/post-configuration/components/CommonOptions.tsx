import { Checkbox, Label, Stack } from '@fluentui/react';
import * as React from 'react';

export interface ICommonOptionsProps {
    options: { [key: string]: { label: string; checked: boolean } };
    onChange?: (optionKey: string, checked: boolean) => void;
}

export interface ICommonOptionsState {}

export class CommonOptions extends React.Component<ICommonOptionsProps, ICommonOptionsState> {
    constructor(props: ICommonOptionsProps) {
        super(props);

        this.state = {};
    }

    private renderOptions() {
        const { options } = this.props;
        return Object.keys(options).map(optionKey => {
            const { checked, label: title } = options[optionKey];
            return (
                <Checkbox
                    key={optionKey}
                    label={title}
                    checked={checked}
                    onChange={(_, checked) => this.props.onChange?.apply(this, [optionKey, checked])}
                />
            );
        });
    }

    public render() {
        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Label>常用选项</Label>
                <Stack horizontal tokens={{ childrenGap: 16 }}>
                    {this.renderOptions()}
                </Stack>
            </Stack>
        );
    }
}
