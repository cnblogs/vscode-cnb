import { Checkbox, Label, Stack } from '@fluentui/react'
import * as React from 'react'

type Option = { [key: string]: { label: string; checked: boolean } }

export interface ICommonOptionsProps<TOption extends Option = Option> {
    options: TOption
    onChange?: (optionKey: keyof TOption, checked: boolean, stateObj: { [p in typeof optionKey]: boolean }) => void
}

export class CommonOptions<TOption extends Option = Option> extends React.Component<ICommonOptionsProps<TOption>> {
    constructor(props: ICommonOptionsProps<TOption>) {
        super(props)

        this.state = {}
    }

    render() {
        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Label>常用选项</Label>
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
