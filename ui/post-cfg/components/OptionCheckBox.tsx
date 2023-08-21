import { Checkbox, Label, Stack } from '@fluentui/react'
import * as React from 'react'
import { Component } from 'react'

type Option = { [key: string]: { label: string; checked: boolean } }

type Props<TOption extends Option = Option> = {
    options: TOption
    onChange?: (optionKey: keyof TOption, checked: boolean, stateObj: { [p in typeof optionKey]: boolean }) => void
}

export class OptionCheckBox<TOption extends Option = Option> extends Component<Props<TOption>> {
    constructor(props: Props<TOption>) {
        super(props)

        this.state = {}
    }

    render() {
        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Label>选项</Label>
                <Stack horizontal tokens={{ childrenGap: 16 }}>
                    {this.renderOptions()}
                </Stack>
            </Stack>
        )
    }

    private renderOptions() {
        const { options } = this.props
        return Object.keys(options).map((optionKey: keyof TOption) => {
            const { checked: isChecked, label: title } = options[optionKey]
            return (
                <Checkbox
                    key={optionKey as string}
                    label={title}
                    checked={isChecked}
                    onChange={(_, checked) =>
                        this.props.onChange?.apply(this, [
                            optionKey,
                            checked ?? false,
                            { [optionKey]: checked ?? false },
                        ])
                    }
                />
            )
        })
    }
}
