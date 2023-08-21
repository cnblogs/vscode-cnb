import { ChoiceGroup, IChoiceGroupOption, Label, Stack } from '@fluentui/react'
import { AccessPermission, formatAccessPermission } from '@/model/post'
import React, { Component } from 'react'

type Props = {
    accessPermission?: AccessPermission
    onChange?: (accessPermission: AccessPermission) => void
}

type State = Record<string, never>

const options: IChoiceGroupOption[] = [
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

export class PermissionSelect extends Component<Props, State> {
    constructor(props: Props) {
        props.accessPermission ??= AccessPermission.undeclared
        super(props)

        this.state = {}
    }

    render() {
        return (
            <Stack>
                <Label>谁能访问这篇博文</Label>
                <ChoiceGroup
                    options={options}
                    onChange={(_, option) =>
                        this.props.onChange?.apply(this, [option?.value ?? AccessPermission.undeclared])
                    }
                    selectedKey={this.props.accessPermission?.toString()}
                />
            </Stack>
        )
    }
}
