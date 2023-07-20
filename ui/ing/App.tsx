import { Spinner, Stack } from '@fluentui/react'
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { Ing, IngComment } from '@models/ing'
import { IngAppState } from '@models/ing-view'
import { IngWebviewUiCmd, WebviewCmd } from '@models/webview-cmd'
import { IngList } from 'ing/IngList'
import { cloneWith } from 'lodash-es'
import React, { Component, ReactNode } from 'react'
import { activeThemeProvider } from 'share/active-theme-provider'
import { getVsCodeApiSingleton } from 'share/vscode-api'

export class App extends Component<unknown, IngAppState> {
    constructor(props: unknown) {
        super(props)

        this.state = {
            theme: activeThemeProvider.activeTheme(),
            isRefreshing: false,
        }

        this.observeMessages()
        this.refresh()
    }

    override componentDidMount(): void {
        console.debug('IngApp mounted')
        this.setState({ theme: activeThemeProvider.activeTheme() })
    }

    render(): ReactNode {
        const { ings, isRefreshing, theme, comments } = this.state
        return (
            <React.StrictMode>
                <ThemeProvider theme={theme} style={{ fontSize: 'var(--vscode-font-size)' }}>
                    {isRefreshing ? (
                        <Stack verticalAlign="center" style={{ height: '100vh' }}>
                            <Stack.Item>
                                <Spinner label="加载中, 请稍后..."></Spinner>
                            </Stack.Item>
                        </Stack>
                    ) : (
                        <IngList ings={ings ?? []} comments={comments ?? {}} />
                    )}
                </ThemeProvider>
            </React.StrictMode>
        )
    }

    private observeMessages() {
        window.addEventListener('message', ({ data: { command, payload } }: { data: IngWebviewUiCmd }) => {
            switch (command) {
                case WebviewCmd.IngCmd.UiCmd.setAppState: {
                    const { ings, isRefreshing, comments } = payload as Partial<IngAppState>
                    this.setState({
                        ings: ings?.map(Ing.parse) ?? this.state.ings,
                        isRefreshing: isRefreshing ?? this.state.isRefreshing,
                        comments: comments
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
                    break
                }
                case WebviewCmd.IngCmd.UiCmd.updateTheme:
                    this.setState({ theme: activeThemeProvider.activeTheme() })
                    break
            }
        })
    }

    private refresh() {
        getVsCodeApiSingleton().postMessage({
            command: WebviewCmd.IngCmd.ExtCmd.refreshIngsList,
            payload: {},
        })
    }
}
