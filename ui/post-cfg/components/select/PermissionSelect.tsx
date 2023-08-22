import { ChoiceGroup, IChoiceGroupOption, Label, Stack } from '@fluentui/react'
import { AccessPermission } from '@/model/post'
import React, { Component } from 'react'

type Props = {
    accessPermission: AccessPermission
    onChange: (ap: AccessPermission) => void
}

export class PermissionSelect extends Component<Props> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        const opt: IChoiceGroupOption[] = [
            {
                text: '所有人',
                key: AccessPermission.undeclared.toString(),
                value: AccessPermission.undeclared,
            },
            {
                text: '登录用户',
                key: AccessPermission.authenticated.toString(),
                value: AccessPermission.authenticated,
            },
            {
                text: '仅自己',
                key: AccessPermission.owner.toString(),
                value: AccessPermission.owner,
            },
        ]
        return (
            <Stack>
                <Label>访问权限</Label>
                <ChoiceGroup
                    options={opt}
                    onChange={(_, option) => {
                        if (option !== undefined) this.props.onChange(option.value as AccessPermission)
                    }}
                    selectedKey={this.props.accessPermission?.toString()}
                    styles={{ flexContainer: { display: 'flex', justifyContent: 'space-between' } }}
                />
            </Stack>
        )
    }
}
