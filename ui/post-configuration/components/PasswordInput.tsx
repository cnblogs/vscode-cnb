import { Label, Stack, TextField } from '@fluentui/react';
import React from 'react';

export interface IPasswordInputProps {
    password?: string;
    onChange?: (password: string) => void;
}

export interface IPasswordInputState {}

export class PasswordInput extends React.Component<IPasswordInputProps, IPasswordInputState> {
    constructor(props: IPasswordInputProps) {
        super(props);

        this.state = {};
    }

    public render() {
        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Label>访问密码</Label>
                <TextField
                    type='password'
                    onChange={(_, v) => this.props.onChange?.apply(this, [v])}
                    value={this.props.password}
                    canRevealPassword
                ></TextField>
            </Stack>
        );
    }
}
