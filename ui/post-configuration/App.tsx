import React, { Component } from 'react'
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { Theme, PartialTheme, Stack, Breadcrumb, IBreadcrumbItem, Spinner, initializeIcons } from '@fluentui/react'
import { PostForm } from './components/PostForm'
import { Post } from '@models/post'
import { personalCategoriesStore } from './services/personal-categories-store'
import { siteCategoriesStore } from './services/site-categories-store'
import { tagsStore } from './services/tags-store'
import { webviewMessage } from '@models/webview-message'
import { webviewCommands } from '@models/webview-commands'
import { PostFormContextProvider } from './components/PostFormContextProvider'
import { activeThemeProvider } from 'share/active-theme-provider'
import { darkTheme, lightTheme } from 'share/theme'
import { vsCodeApi } from 'share/vscode-api'

interface AppState {
    post?: Post
    theme?: Theme | PartialTheme
    breadcrumbs?: string[]
    fileName: string
    useNestCategoriesSelect: boolean
}

export interface AppProps extends Record<string, never> {}

class App extends Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props)
        this.state = { theme: activeThemeProvider.activeTheme(), fileName: '', useNestCategoriesSelect: false }
        this.observerMessages()
        vsCodeApi.getInstance().postMessage({ command: webviewCommands.ExtensionCommands.refreshPost })
    }

    render() {
        const { post, fileName } = this.state
        const isReady = post != null
        const content = (
            <>
                {this.renderBreadcrumbs()}
                <Stack tokens={{ padding: '8px 10px 16px 10px' }}>
                    <PostFormContextProvider>
                        <PostForm
                            post={this.state.post}
                            onTitleChange={title =>
                                this.state.breadcrumbs && this.state.breadcrumbs.length > 1
                                    ? this.setState({
                                          breadcrumbs: this.state.breadcrumbs
                                              .slice(0, this.state.breadcrumbs.length - 1)
                                              .concat(title),
                                      })
                                    : undefined
                            }
                            fileName={fileName}
                            useNestCategoriesSelect={this.state.useNestCategoriesSelect}
                        />
                    </PostFormContextProvider>
                </Stack>
            </>
        )
        return (
            <React.StrictMode>
                <ThemeProvider theme={this.state.theme}>{isReady ? content : this.renderSpinner()}</ThemeProvider>
            </React.StrictMode>
        )
    }

    private renderSpinner() {
        return (
            <Stack styles={{ root: { minHeight: '70vh' } }} verticalAlign="center">
                <Spinner label="别着急, 数据加载中~" labelPosition="bottom" />
            </Stack>
        )
    }

    private renderBreadcrumbs() {
        const { breadcrumbs } = this.state
        if (!breadcrumbs || breadcrumbs.length <= 0) return <></>

        const items = breadcrumbs.map(breadcrumb => ({ text: breadcrumb, key: breadcrumb } as IBreadcrumbItem))
        return <Breadcrumb styles={{ item: { fontSize: 12 } }} items={items}></Breadcrumb>
    }

    private observerMessages() {
        window.addEventListener('message', ev => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { command } = ev.data
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const message = ev.data as any

            if (command === webviewCommands.UiCommands.editPostConfiguration) {
                const { post, activeTheme, personalCategories, siteCategories, tags, breadcrumbs, fileName } =
                    message as webviewMessage.EditPostConfigurationMessage
                personalCategoriesStore.set(personalCategories)
                siteCategoriesStore.set(siteCategories)
                tagsStore.set(tags)

                this.setState({
                    theme: activeTheme === 2 ? darkTheme : lightTheme,
                    post,
                    breadcrumbs,
                    fileName,
                    useNestCategoriesSelect: personalCategories.some(c => c.childCount > 0),
                })
            } else if (command === webviewCommands.UiCommands.updateBreadcrumbs) {
                const { breadcrumbs } = message as webviewMessage.UpdateBreadcrumbsMessage
                this.setState({ breadcrumbs })
            } else if (command === webviewCommands.UiCommands.setFluentIconBaseUrl) {
                const { baseUrl } = message as webviewMessage.SetFluentIconBaseUrlMessage
                initializeIcons(baseUrl)
            } else if (command === webviewCommands.UiCommands.updateTheme) {
                this.setState({ theme: activeThemeProvider.activeTheme() })
            }
        })
    }
}

export { App }
