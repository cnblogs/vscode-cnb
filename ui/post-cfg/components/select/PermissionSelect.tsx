import { ChoiceGroup, Label, Stack } from '@fluentui/react'
import { AccessPermission, formatAccessPermission } from '@/model/post'
import React, { Component } from 'react'

type Props = {
    accessPermission?: AccessPermission
    onChange: (ap: AccessPermission) => void
}

type State = Record<string, never>

export class PermissionSelect extends Component<Props, State> {
    constructor(props: Props) {
        props.accessPermission ??= AccessPermission.undeclared
        super(props)

        this.state = {}
    }

    render() {
        const opt = [
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
        return (
            <Stack>
                <Label>谁能访问这篇博文</Label>
                <ChoiceGroup
                    options={opt}
                    onChange={(_, option) =>
                        this.props.onChange(
                            (option?.value as AccessPermission | undefined) ?? AccessPermission.undeclared
                        )
                    }
                    selectedKey={this.props.accessPermission?.toString()}
                />
            </Stack>
        )
    }
}
