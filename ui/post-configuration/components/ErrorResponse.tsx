import { MessageBar, MessageBarType } from '@fluentui/react';
import { webviewCommands } from '@models/webview-commands';
import { webviewMessage } from '@models/webview-message';
import React from 'react';
import { Optional } from 'utility-types';
import { PostFormContext } from './PostFormContext';

export interface IErrorResponseProps extends Record<string, never> {}

export interface IErrorResponseState {
    errors: string[];
}

export class ErrorResponse extends React.Component<IErrorResponseProps, IErrorResponseState> {
    static contextType = PostFormContext;
    declare context: React.ContextType<typeof PostFormContext>;

    private elementId = '';

    constructor() {
        super({});

        this.state = { errors: [] };
        window.addEventListener('message', msg => {
            const { command, errorResponse } = (msg.data ?? {}) as any as Optional<
                webviewMessage.ShowErrorResponseMessage,
                'command'
            >;
            if (command === webviewCommands.UiCommands.showErrorResponse) {
                this.setState({ errors: errorResponse.errors ?? [] }, () => this.reveal());
                this.context.set({ disabled: false, status: '' });
            }
        });
    }

    reveal() {
        document.querySelector(`#${this.elementId}`)?.scrollIntoView();
    }

    render() {
        const { errors } = this.state;
        if (errors.length <= 0) return <></>;

        this.elementId = `errorResponse ${Date.now()}`;
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
