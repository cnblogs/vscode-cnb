import { ActionButton, Label, Stack, Text, TextField } from '@fluentui/react'
import React, { Component } from 'react'

type Props = {
    value: string
    fileName: string
    onChange: (value: string | null | undefined) => unknown
}

type State = {
    value: Props['value']
}

export default class PostTitleInput extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            value: props.value,
        }
    }

    render() {
        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                    <Label styles={{ root: { whiteSpace: 'nowrap' } }}>博文标题</Label>
                    {this.props.fileName !== '' && this.props.fileName !== this.state.value ? (
                        <ActionButton
                            onClick={() => {
                                this.setState({ value: this.props.fileName })
                                this.props.onChange(this.state.value)
                            }}
                            styles={{ root: { height: 'auto', whiteSpace: 'nowrap' } }}
                            secondaryText={this.props.fileName}
                        >
                            使用本地文件名:&nbsp;
                            <code>
                                <Text>"{this.props.fileName}"</Text>
                            </code>
                        </ActionButton>
                    ) : (
                        <></>
                    )}
                </Stack>
                <Stack>
                    <TextField
                        value={this.state.value}
                        onChange={(_, v) => {
                            this.setState({ value: v ?? '' })
                            this.props.onChange(v)
                        }}
                    ></TextField>
                </Stack>
            </Stack>
        )
    }
}
