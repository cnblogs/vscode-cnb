import React, { Component } from 'react'
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { Breadcrumb, IBreadcrumbItem, initializeIcons, PartialTheme, Spinner, Stack, Theme } from '@fluentui/react'
import { PostForm } from './components/PostForm'
import { Post } from '@/model/post'
import { personalCategoriesStore } from './service/personal-category-store'
import { siteCategoriesStore } from './service/site-category-store'
import { tagsStore } from './service/tags-store'
import { WebviewMsg } from '@/model/webview-msg'
import { WebviewCmd } from '@/model/webview-cmd'
import { PostFormContextProvider } from './components/PostFormContextProvider'
import { activeThemeProvider } from 'share/active-theme-provider'
import { darkTheme, lightTheme } from 'share/theme'
import { getVsCodeApiSingleton } from 'share/vscode-api'

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
        getVsCodeApiSingleton().postMessage({ command: WebviewCmd.ExtCmd.refreshPost })
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

        const items = breadcrumbs.map(breadcrumb => ({ text: breadcrumb, key: breadcrumb }) as IBreadcrumbItem)
        return <Breadcrumb styles={{ item: { fontSize: 12 } }} items={items}></Breadcrumb>
    }

    private observerMessages() {
        window.addEventListener('message', ev => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { command } = ev.data
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const message = ev.data as any

            if (command === WebviewCmd.UiCmd.editPostCfg) {
                const { post, activeTheme, personalCategories, siteCategories, tags, breadcrumbs, fileName } =
                    message as WebviewMsg.EditPostCfgMsg
                personalCategoriesStore.set(personalCategories)
                siteCategoriesStore.set(siteCategories)
                tagsStore.set(tags)

                this.setState({
                    theme: (activeTheme as number) === 2 ? darkTheme : lightTheme,
                    post,
                    breadcrumbs,
                    fileName,
                    useNestCategoriesSelect: personalCategories.some(c => c.childCount > 0),
                })
            } else if (command === WebviewCmd.UiCmd.updateBreadcrumbs) {
                const { breadcrumbs } = message as WebviewMsg.UpdateBreadcrumbMsg
                this.setState({ breadcrumbs })
            } else if (command === WebviewCmd.UiCmd.setFluentIconBaseUrl) {
                const { baseUrl } = message as WebviewMsg.SetFluentIconBaseUrlMsg
                initializeIcons(baseUrl)
            } else if (command === WebviewCmd.UiCmd.updateTheme) {
                this.setState({ theme: activeThemeProvider.activeTheme() })
            }
        })
    }
}

export { App }
