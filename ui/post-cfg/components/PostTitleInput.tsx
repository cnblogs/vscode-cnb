import { ActionButton, Label, Stack, Text, TextField } from '@fluentui/react'
import React from 'react'

export type IPostTitleInputProps = {
    value: string
    fileName: string
    onChange: (value: string | null | undefined) => unknown
}

export type IPostTitleInputState = {
    value: IPostTitleInputProps['value']
}

export default class PostTitleInput extends React.Component<IPostTitleInputProps, IPostTitleInputState> {
    constructor(props: IPostTitleInputProps) {
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
