import { MessageBar, MessageBarType } from '@fluentui/react';
import { webviewCommand } from '@models/webview-command';
import { webviewMessage } from '@models/webview-message';
import React from 'react';
import { Optional } from 'utility-types';
import { IPostFormContext, PostFormContext } from './PostFormContext';

export interface IErrorResponseProps {}

export interface IErrorResponseState {
    errors: string[];
}

export class ErrorResponse extends React.Component<IErrorResponseProps, IErrorResponseState> {
    static contextType?: React.Context<IPostFormContext> | undefined = PostFormContext;
    private elementId: string = '';
    constructor(props: IErrorResponseProps) {
        super(props);

        this.state = { errors: [] };
        window.addEventListener('message', msg => {
            const { command, errorResponse } = (msg.data ?? {}) as Optional<
                webviewMessage.ShowErrorResponseMessage,
                'command'
            >;
            if (command === webviewCommand.UiCommands.showErrorResponse) {
                this.setState({ errors: errorResponse.errors ?? [] }, () => this.reveal());
                this.context.set({ disabled: false, status: '' } as IPostFormContext);
            }
        });
    }

    reveal() {
        document.querySelector(`#${this.elementId}`)?.scrollIntoView();
    }

    public render() {
        const { errors } = this.state;
        if (errors.length <= 0) {
            return <></>;
        }
        this.elementId = 'errorResponse' + Date.now();
        return (
            <MessageBar
                onDismiss={() => this.setState({ errors: [] })}
                id={this.elementId}
                messageBarType={MessageBarType.error}
            >
                {errors.join('\n')}
            </MessageBar>
        );
    }
}
