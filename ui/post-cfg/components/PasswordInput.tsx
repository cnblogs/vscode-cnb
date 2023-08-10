import { Label, Stack, TextField } from '@fluentui/react'
import React from 'react'

export type IPasswordInputProps = {
    password?: string
    onChange?: (password: string) => void
}

export class PasswordInput extends React.Component<IPasswordInputProps> {
    constructor(props: IPasswordInputProps) {
        super(props)

        this.state = {}
    }

    render() {
        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Label>访问密码</Label>
                <TextField
                    type="password"
                    onChange={(_, v) => void this.props.onChange?.apply(this, [v])}
                    value={this.props.password}
                    canRevealPassword
                ></TextField>
            </Stack>
        )
    }
}
