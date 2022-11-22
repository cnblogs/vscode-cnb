import React, { Component, ReactNode } from 'react';
import { IngWebviewUiCommand, webviewCommands } from '@models/webview-commands';
import { IngList } from 'ing/IngList';
import { vsCodeApi } from 'share/vscode-api';
import { IngAppState } from '@models/ing-view';
import { Ing } from '@models/ing';
import { activeThemeProvider } from 'share/active-theme-provider';
import { ThemeProvider } from '@fluentui/react/lib/Theme';
import { Spinner, Stack } from '@fluentui/react';

export class App extends Component<unknown, IngAppState> {
    constructor(props: unknown) {
        super(props);

        this.state = {
            theme: activeThemeProvider.activeTheme(),
            isRefreshing: false,
        };

        this.observeMessages();
        this.refresh();
    }

    override componentDidMount(): void {
        console.debug('IngApp mounted');
        this.setState({ theme: activeThemeProvider.activeTheme() });
    }

    render(): ReactNode {
        const { ings, isRefreshing, theme } = this.state;
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
                        <IngList ings={ings ?? []} />
                    )}
                </ThemeProvider>
            </React.StrictMode>
        );
    }

    private observeMessages() {
        window.addEventListener('message', ({ data: { command, payload } }: { data: IngWebviewUiCommand }) => {
            switch (command) {
                case webviewCommands.ingCommands.UiCommands.setAppState: {
                    const { ings, isRefreshing } = payload as Partial<IngAppState>;
                    this.setState({
                        ings: ings?.map(Ing.parse) ?? this.state.ings,
                        isRefreshing: isRefreshing ?? this.state.isRefreshing,
                    });
                    break;
                }
                case webviewCommands.ingCommands.UiCommands.updateTheme:
                    this.setState({ theme: activeThemeProvider.activeTheme() });
                    break;
            }
        });
    }

    private refresh() {
        vsCodeApi.getInstance().postMessage({
            command: webviewCommands.ingCommands.ExtensionCommands.refreshIngsList,
            payload: {},
        });
    }
}
