import * as React from 'react'
import { PostFormContext, IPostFormContext, defaultPostFormContext } from './PostFormContext'
import { ReactNode } from 'react'

export interface IPostFormContextProviderProps {
    value?: Partial<IPostFormContext>
    children: ReactNode
}

export interface IPostFormContextProviderState {
    value: IPostFormContext
}

export class PostFormContextProvider extends React.Component<
    IPostFormContextProviderProps,
    IPostFormContextProviderState
> {
    constructor(props: IPostFormContextProviderProps) {
        super(props)
        const set = (value: IPostFormContext) => this.setState({ value: Object.assign(value, { set }) })
        this.state = {
            value: Object.assign({}, defaultPostFormContext, {
                set,
            } as IPostFormContext),
        }
    }

    render() {
        const { children } = this.props
        return <PostFormContext.Provider value={this.state.value}>{children}</PostFormContext.Provider>
    }
}
