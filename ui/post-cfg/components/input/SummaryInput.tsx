import { ActionButton, Label, MessageBar, MessageBarType, Stack, TextField, Text } from '@fluentui/react'
import { ImgUploadStatusId } from '@/model/img-upload-status'
import { Webview } from '@/model/webview-cmd'
import { WebviewMsg } from '@/model/webview-msg'
import React, { Component } from 'react'
import { getVsCodeApiSingleton } from 'share/vscode-api'

type Props = {
    summary?: string
    featureImgUrl: string
    onChange?: (summary: string) => void
    onFeatureImageChange?: (imageUrl: string) => void
}

type State = {
    isCollapse: boolean
    disabled: boolean
    errors?: string[]
}

export class SummaryInput extends Component<Props, State> {
    private uploadingImageId = ''

    constructor(props: Props) {
        super(props)
        const { featureImgUrl, summary } = props

        this.state = { isCollapse: featureImgUrl === '' && summary === undefined, disabled: false }
        window.addEventListener('message', this.observerMessage)
    }

    render() {
        const isCollapse = this.state.isCollapse
        const featureImgUrl = this.props.featureImgUrl
        return (
            <Stack tokens={{ childrenGap: 16 }}>
                <Stack horizontal horizontalAlign="space-between">
                    <ActionButton
                        onClick={() => this.setState({ isCollapse: !isCollapse })}
                        styles={{ root: { height: 'auto', paddingLeft: 0 } }}
                    >
                        <Label styles={{ root: { paddingBottom: 0, paddingTop: 0 } }}>摘要和题图</Label>
                        <ActionButton
                            iconProps={{ iconName: isCollapse ? 'CirclePlus' : 'SkypeCircleMinus' }}
                            styles={{ root: { height: 'auto' } }}
                        />
                    </ActionButton>
                    {!isCollapse && featureImgUrl !== '' ? (
                        <ActionButton
                            onClick={() => void this.props.onFeatureImageChange?.apply(this, [''])}
                            styles={{ root: { height: 'auto', paddingLeft: 0 } }}
                        >
                            <Text variant="smallPlus">删除题图</Text>
                            <ActionButton
                                iconProps={{ iconName: 'Clear' }}
                                styles={{ root: { height: 'auto' }, icon: { fontSize: 12 } }}
                            />
                        </ActionButton>
                    ) : (
                        <></>
                    )}
                </Stack>

                {this.renderContent()}
            </Stack>
        )
    }

    private renderContent() {
        if (this.state.isCollapse) return <></>

        return (
            <Stack tokens={{ childrenGap: 8 }}>
                <Stack horizontal horizontalAlign="stretch" tokens={{ childrenGap: 8 }} verticalAlign="stretch">
                    <Stack.Item grow={true} align="stretch">
                        <TextField
                            disabled={this.state.disabled}
                            styles={{ field: { height: 70 } }}
                            onChange={(_, value) => void this.props.onChange?.apply(this, [value])}
                            multiline
                            placeholder="输入摘要"
                            value={this.props.summary}
                            resizable={false}
                        />
                    </Stack.Item>
                    <Stack.Item align="stretch">{this.renderFeatureImage()}</Stack.Item>
                </Stack>

                {this.state.errors !== undefined ? (
                    <MessageBar
                        onDismiss={() => {
                            this.setState({ errors: undefined })
                        }}
                        messageBarType={MessageBarType.error}
                    >
                        {this.state.errors?.join('\n')}
                    </MessageBar>
                ) : (
                    <></>
                )}
            </Stack>
        )
    }

    private observerMessage = (ev: MessageEvent<any>) => {
        const data = ev.data as WebviewMsg.Msg
        if (data.command !== Webview.Cmd.Ui.updateImageUploadStatus) return

        const msg = data as WebviewMsg.UpdateImgUpdateStatusMsg
        const { imageId, status } = msg
        if (imageId === this.uploadingImageId) {
            this.setState({ disabled: status.id === ImgUploadStatusId.uploading })
            if (status.id === ImgUploadStatusId.uploaded && this.props.onFeatureImageChange !== undefined)
                this.props.onFeatureImageChange(status.imageUrl ?? '')
        }
    }

    private uploadFeatureImage() {
        this.uploadingImageId = `${Date.now()}`

        const msg = {
            command: Webview.Cmd.Ext.uploadImg,
            imageId: this.uploadingImageId,
        } as WebviewMsg.UploadImgMsg

        getVsCodeApiSingleton().postMessage(msg)
    }

    private renderFeatureImage() {
        const featureImgUrl = this.props.featureImgUrl

        if (featureImgUrl !== '') {
            return (
                <span>
                    <img style={{ width: 135, height: 70 }} src={featureImgUrl} alt="题图" />
                </span>
            )
        }

        return (
            <ActionButton
                onClick={() => this.uploadFeatureImage()}
                width={135}
                styles={{ root: { height: 70 } }}
                iconProps={{ iconName: 'Add' }}
                disabled={this.state.disabled}
            >
                上传图片
            </ActionButton>
        )
    }
}
