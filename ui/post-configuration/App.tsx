import React, { Component } from 'react';
import { ThemeProvider } from '@fluentui/react/lib/Theme';
import { Theme, PartialTheme, Stack, Breadcrumb, IBreadcrumbItem, Spinner, initializeIcons } from '@fluentui/react';
import { darkTheme, lightTheme } from './models/theme';
import { PostForm } from './components/PostForm';
import { Post } from '@models/post';
import { personalCategoriesStore } from './services/personal-categories-store';
import { siteCategoriesStore } from './services/site-categories-store';
import { tagsStore } from './services/tags-store';
import { webviewMessage } from '@models/webview-message';
import { webviewCommand } from '@models/webview-command';
import { PostFormContextProvider } from './components/PostFormContextProvider';
import { activeThemeProvider } from './services/active-theme-provider';

interface AppState {
    post?: Post;
    theme?: Theme | PartialTheme;
    breadcrumbs?: string[];
}

export interface AppProps extends Record<string, never> {}

const resolveTheme = (colorThemeKind?: number | undefined | null) => {
    const isDark = colorThemeKind === 2 || activeThemeProvider.getActiveTheme() === 'dark';
    return isDark ? darkTheme : lightTheme;
};

class App extends Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = { theme: resolveTheme() };
        this.observerMessages();
    }

    render() {
        const isReady = !!this.state.post;
        const content = (
            <>
                {this.renderBreadcrumbs()}
                <Stack tokens={{ padding: '8px 10px 16px 10px' }}>
                    <PostFormContextProvider>
                        <PostForm post={this.state.post} />
                    </PostFormContextProvider>
                </Stack>
            </>
        );
        return (
            <React.StrictMode>
                <ThemeProvider theme={this.state.theme}>{isReady ? content : this.renderSpinner()}</ThemeProvider>
            </React.StrictMode>
        );
    }

    private renderSpinner() {
        return (
            <Stack styles={{ root: { minHeight: '70vh' } }} verticalAlign="center">
                <Spinner label="别着急, 数据加载中~" labelPosition="bottom" />
            </Stack>
        );
    }

    private renderBreadcrumbs() {
        const { breadcrumbs } = this.state;
        if (!breadcrumbs || breadcrumbs.length <= 0) return <></>;

        const items = breadcrumbs.map(breadcrumb => ({ text: breadcrumb, key: breadcrumb } as IBreadcrumbItem));
        return <Breadcrumb styles={{ item: { fontSize: 12 } }} items={items}></Breadcrumb>;
    }

    private observerMessages() {
        window.addEventListener('message', ev => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const message: webviewMessage.Message = ev.data ?? {};
            const { command } = message;
            if (command === webviewCommand.UiCommands.editPostConfiguration) {
                const { post, activeTheme, personalCategories, siteCategories, tags, breadcrumbs } =
                    message as webviewMessage.EditPostConfigurationMessage;
                personalCategoriesStore.set(personalCategories);
                siteCategoriesStore.set(siteCategories);
                tagsStore.set(tags);

                this.setState({
                    theme: activeTheme === 2 ? darkTheme : lightTheme,
                    post: post,
                    breadcrumbs,
                });
            } else if (command === webviewCommand.UiCommands.updateBreadcrumbs) {
                const { breadcrumbs } = message as webviewMessage.UpdateBreadcrumbsMessage;
                this.setState({ breadcrumbs });
            } else if (command === webviewCommand.UiCommands.setFluentIconBaseUrl) {
                const { baseUrl } = message as webviewMessage.SetFluentIconBaseUrlMessage;
                initializeIcons(baseUrl);
            } else if (command === webviewCommand.UiCommands.changeTheme) {
                const { colorThemeKind } = message as webviewMessage.ChangeThemeMessage;
                this.setState({ theme: resolveTheme(colorThemeKind) });
            }
        });
    }
}

export { App };
