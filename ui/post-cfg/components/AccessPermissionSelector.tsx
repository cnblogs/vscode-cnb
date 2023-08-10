import { ChoiceGroup, IChoiceGroupOption, Label, Stack } from '@fluentui/react'
import { AccessPermission, formatAccessPermission } from '@/model/post'
import React from 'react'

export type IAccessPermissionSelectorProps = {
    accessPermission?: AccessPermission
    onChange?: (accessPermission: AccessPermission) => void
}

export interface IAccessPermissionSelectorState extends Record<string, never> {}

export class AccessPermissionSelector extends React.Component<
    IAccessPermissionSelectorProps,
    IAccessPermissionSelectorState
> {
    private options: IChoiceGroupOption[] = [
        {
            text: formatAccessPermission(AccessPermission.undeclared),
            value: AccessPermission.undeclared,
            key: AccessPermission.undeclared.toString(),
        },
        {
            text: formatAccessPermission(AccessPermission.authenticated),
            value: AccessPermission.authenticated,
            key: AccessPermission.authenticated.toString(),
        },
        {
            text: formatAccessPermission(AccessPermission.owner),
            value: AccessPermission.owner,
            key: AccessPermission.owner.toString(),
        },
    ]

    constructor(props: IAccessPermissionSelectorProps) {
        props.accessPermission ??= AccessPermission.undeclared
        super(props)

        this.state = {}
    }

    render() {
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
        )
    }
}
