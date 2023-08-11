import { MessageBar, MessageBarType } from '@fluentui/react'
import { Webview } from '@/model/webview-cmd'
import { WebviewMsg } from '@/model/webview-msg'
import React from 'react'
import { Optional } from 'utility-types'
import { PostFormContext } from './PostFormContext'

export interface IErrorResponseProps extends Record<string, never> {}

export type IErrorResponseState = {
    errors: string[]
}

export class ErrorResponse extends React.Component<IErrorResponseProps, IErrorResponseState> {
    static contextType = PostFormContext
    declare context: React.ContextType<typeof PostFormContext>

    private elementId = ''

    constructor() {
        super({})

        this.state = { errors: [] }
        window.addEventListener('message', msg => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data = msg.data ?? {}
            const { command, errorResponse } = data as Optional<WebviewMsg.ShowErrRespMsg, 'command'>
            if (command === Webview.Cmd.Ui.showErrorResponse) {
                this.setState({ errors: errorResponse.errors ?? [] }, () => this.reveal())
                this.context.set({ disabled: false, status: '' })
            }
        })
    }

    reveal() {
        document.querySelector(`#${this.elementId}`)?.scrollIntoView()
    }

    render() {
        const errors = this.state.errors
        if (errors.length <= 0) return <></>

        this.elementId = `errorResponse ${Date.now()}`
        return (
            <MessageBar
                onDismiss={() => this.setState({ errors: [] })}
                id={this.elementId}
                messageBarType={MessageBarType.error}
            >
                {errors.join('\n')}
            </MessageBar>
        )
    }
}
