import { ActionButton, ITextField, Label, Stack, TextField } from '@fluentui/react';
import * as React from 'react';

export interface IPostEntryNameInputProps {
    entryName?: string;
    onChange?: (value: string) => void;
}

export interface IPostEntryNameInputState {
    isCollapsed: boolean;
}

export default class PostEntryNameInput extends React.Component<IPostEntryNameInputProps, IPostEntryNameInputState> {
    textFieldComp?: ITextField | null;
    constructor(props: IPostEntryNameInputProps) {
        super(props);

        this.state = {
            isCollapsed: true,
        };
    }

    public render() {
        return (
            <Stack tokens={{ childrenGap: 16 }}>
                <ActionButton
                    styles={{
                        root: {
                            height: 'auto',
                            paddingLeft: 0,
                            borderLeft: 0,
                        },
                    }}
                    onClick={() => this.setState({ isCollapsed: !this.state.isCollapsed })}
                >
                    <Stack horizontal tokens={{ childrenGap: 2 }} verticalAlign='center'>
                        <Label
                            styles={{
                                root: {
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                },
                            }}
                        >
                            友好地址名(URL Slug)
                        </Label>
                        <ActionButton
                            styles={{
                                root: {
                                    height: 'auto',
                                },
                            }}
                            iconProps={{ iconName: this.state.isCollapsed ? 'CirclePlus' : 'SkypeCircleMinus' }}
                        />
                    </Stack>
                </ActionButton>
                {this.state.isCollapsed ? (
                    <></>
                ) : (
                    <Stack tokens={{ childrenGap: 12 }}>
                        <TextField
                            componentRef={input => {
                                this.textFieldComp = input;
                                if (this.state.isCollapsed === false) {
                                    this.textFieldComp?.focus();
                                }
                            }}
                            value={this.props.entryName}
                            onChange={(_, value) => this.props.onChange?.call(this, value)}
                            description='友好地址名，只能使用字母、数字、-连字符、_下划线，不超过150个字符'
                        ></TextField>
                    </Stack>
                )}
            </Stack>
        );
    }
}
