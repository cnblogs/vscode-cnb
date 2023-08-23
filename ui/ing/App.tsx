import React, { Component, ReactNode } from 'react'
import { IngWebviewUiCmd, Webview } from '@/model/webview-cmd'
import { IngList } from 'ing/IngList'
import { getVsCodeApiSingleton } from 'share/vscode-api'
import { Ing, IngComment } from '@/model/ing'
import { ActiveThemeProvider } from 'share/active-theme-provider'
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { Spinner, Stack } from '@fluentui/react'
import { cloneWith } from 'lodash-es'
import { PartialTheme, Theme } from '@fluentui/react'

export type State = {
    ingList?: Ing[]
    theme: Theme | PartialTheme
    isLoading: boolean
    comments?: Record<number, IngComment[]>
}

export class App extends Component<unknown, State> {
    constructor(props: unknown) {
        super(props)

        this.state = {
            theme: ActiveThemeProvider.activeTheme(),
            isLoading: false,
        }

        this.observeMessages()
        this.refresh()
    }

    override componentDidMount(): void {
        console.debug('IngApp mounted')
        this.setState({ theme: ActiveThemeProvider.activeTheme() })
    }

    render(): ReactNode {
        const { ingList, isLoading, theme, comments } = this.state
        return (
            <React.StrictMode>
                <ThemeProvider theme={theme} style={{ fontSize: 'var(--vscode-font-size)' }}>
                    {isLoading ? (
                        <Stack verticalAlign="center" style={{ height: '100vh' }}>
                            <Stack.Item>
                                <Spinner label="加载中, 请稍后..."></Spinner>
                            </Stack.Item>
                        </Stack>
                    ) : (
                        <IngList ingList={ingList ?? []} comments={comments ?? {}} />
                    )}
                </ThemeProvider>
            </React.StrictMode>
        )
    }

    private observeMessages() {
        window.addEventListener('message', ({ data: { command, payload } }: { data: IngWebviewUiCmd }) => {
            if (command === Webview.Cmd.Ing.Ui.setAppState) {
                const { ingList, isLoading, comments } = payload as Partial<State>
                this.setState({
                    ingList: ingList?.map(Ing.parse) ?? this.state.ingList,
                    isLoading: isLoading ?? this.state.isLoading,
                    comments:
                        comments !== undefined
                            ? Object.assign(
                                  {},
                                  this.state.comments ?? {},
                                  cloneWith(comments, v => {
                                      for (const key in v) v[key] = v[key].map(IngComment.parse)
                                      return v
                                  })
                              )
                            : this.state.comments,
                })
                return
            }
            if (command === Webview.Cmd.Ing.Ui.updateTheme) {
                this.setState({ theme: ActiveThemeProvider.activeTheme() })
                return
            }
        })
    }

    private refresh() {
        const vscodeApi = getVsCodeApiSingleton()
        vscodeApi.postMessage({
            command: Webview.Cmd.Ing.Ext.reload,
            payload: {},
        })
    }
}
