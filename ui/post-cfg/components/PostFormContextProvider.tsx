import * as React from 'react'
import { PostFormContext, IPostFormContext, DefaultPostFormCtx } from './PostFormContext'
import { Component, ReactNode } from 'react'

type Props = {
    value?: Partial<IPostFormContext>
    children: ReactNode
}

type State = {
    value: IPostFormContext
}

export class PostFormContextProvider extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        const set = (value: IPostFormContext) => this.setState({ value: Object.assign(value, { set }) })
        this.state = {
            value: Object.assign({}, DefaultPostFormCtx, {
                set,
            } as IPostFormContext),
        }
    }

    render() {
        const { children } = this.props
        return <PostFormContext.Provider value={this.state.value}>{children}</PostFormContext.Provider>
    }
}
