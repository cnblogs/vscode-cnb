import { ActionButton, Label, MessageBar, MessageBarType, Stack, TextField, Text } from '@fluentui/react';
import { ImageUploadStatusId } from '@models/image-upload-status';
import { webviewCommand } from '@models/webview-command';
import { webviewMessage } from '@models/webview-message';
import React from 'react';
import { vsCodeApi } from 'share/vscode-api';

export interface IInputSummaryProps {
    summary?: string;
    featureImageUrl?: string;
    onChange?: (summary: string) => void;
    onFeatureImageChange?: (imageUrl: string) => void;
}

export interface IInputSummaryState {
    isCollapse: boolean;
    disabled: boolean;
    errors?: string[];
}

export class InputSummary extends React.Component<IInputSummaryProps, IInputSummaryState> {
    private uploadingImageId = '';
    constructor(props: IInputSummaryProps) {
        super(props);
        const { featureImageUrl, summary } = props;

        this.state = { isCollapse: !featureImageUrl && !summary, disabled: false };
        window.addEventListener('message', this.observerMessage);
    }

    render() {
        const { isCollapse } = this.state;
        const { featureImageUrl } = this.props;
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
                    {!isCollapse && featureImageUrl ? (
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
        );
    }

    private renderContent() {
        if (this.state.isCollapse) return <></>;

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

                {this.state.errors ? (
                    <MessageBar
                        onDismiss={() => {
                            this.setState({ errors: undefined });
                        }}
                        messageBarType={MessageBarType.error}
                    >
                        {this.state.errors?.join('\n')}
                    </MessageBar>
                ) : (
                    <></>
                )}
            </Stack>
        );
    }

    private observerMessage = (ev: MessageEvent<any>) => {
        const data = ev.data as webviewMessage.Message;
        const { command } = data;
        switch (command) {
            case webviewCommand.UiCommands.updateImageUploadStatus:
                {
                    const { imageId, status } = data as webviewMessage.UpdateImageUpdateStatusMessage;
                    if (imageId === this.uploadingImageId) {
                        this.setState({ disabled: status.id === ImageUploadStatusId.uploading });
                        if (status.id === ImageUploadStatusId.uploaded)
                            this.props.onFeatureImageChange?.apply(this, [status.imageUrl ?? '']);
                    }
                }
                break;
        }
    };

    private uploadFeatureImage() {
        this.uploadingImageId = `${Date.now()}`;
        vsCodeApi.getInstance().postMessage({
            command: webviewCommand.ExtensionCommands.uploadImage,
            imageId: this.uploadingImageId,
        } as webviewMessage.UploadImageMessage);
    }

    private renderFeatureImage() {
        const { featureImageUrl } = this.props;
        if (!featureImageUrl) {
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
            );
        }
        return (
            <span>
                <img style={{ width: 135, height: 70 }} src={featureImageUrl} alt="题图" />
            </span>
        );
    }
}
