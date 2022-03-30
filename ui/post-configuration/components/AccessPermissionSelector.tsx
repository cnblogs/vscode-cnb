import { ChoiceGroup, IChoiceGroupOption, Label, Stack } from '@fluentui/react';
import { AccessPermission } from '../../../src/models/post';
import React from 'react';

export interface IAccessPermissionSelectorProps {
    accessPermission?: AccessPermission;
    onChange?: (accessPermission: AccessPermission) => void;
}

export interface IAccessPermissionSelectorState {}

export class AccessPermissionSelector extends React.Component<
    IAccessPermissionSelectorProps,
    IAccessPermissionSelectorState
> {
    private options: IChoiceGroupOption[] = [
        {
            text: '所有人',
            value: AccessPermission.undeclared,
            key: AccessPermission.undeclared.toString(),
        },
        {
            text: '登录用户',
            value: AccessPermission.authenticated,
            key: AccessPermission.authenticated.toString(),
        },
        {
            text: '只有我',
            value: AccessPermission.owner,
            key: AccessPermission.owner.toString(),
        },
    ];
    constructor(props: IAccessPermissionSelectorProps) {
        props.accessPermission ??= AccessPermission.undeclared;
        super(props);

        this.state = {};
    }

    public render() {
        return (
            <Stack>
                <Label>谁能访问这篇博文</Label>
                <ChoiceGroup
                    options={this.options}
                    onChange={(_, option) =>
                        this.props.onChange?.apply(this, [option?.value ?? AccessPermission.undeclared])
                    }
                    selectedKey={this.props.accessPermission?.toString()}
                />
            </Stack>
        );
    }
}
