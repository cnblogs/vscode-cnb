import React, { Component } from 'react'
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { Breadcrumb, IBreadcrumbItem, initializeIcons, PartialTheme, Spinner, Stack, Theme } from '@fluentui/react'
import { PostForm } from './components/PostForm'
import { Post } from '@/model/post'
import { PersonalCategoryStore } from './service/personal-category-store'
import { SiteCategoryStore } from './service/site-category-store'
import { TagStore } from './service/tag-store'
import { WebviewMsg } from '@/model/webview-msg'
import { Webview } from '@/model/webview-cmd'
import { PostFormContextProvider } from './components/PostFormContextProvider'
import { ActiveThemeProvider } from 'share/active-theme-provider'
import { darkTheme, lightTheme } from 'share/theme'
import { getVsCodeApiSingleton } from 'share/vscode-api'

type Props = Record<string, never>

type State = {
    post?: Post
    theme?: Theme | PartialTheme
    breadcrumbs?: string[]
    fileName: string
    useNestCategoriesSelect: boolean
}

export class App extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { theme: ActiveThemeProvider.activeTheme(), fileName: '', useNestCategoriesSelect: false }
        this.observerMessages()
        getVsCodeApiSingleton().postMessage({ command: Webview.Cmd.Ext.refreshPost })
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
                                this.state.breadcrumbs !== undefined && this.state.breadcrumbs.length > 1
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
        const breadcrumbs = this.state.breadcrumbs
        if (breadcrumbs === undefined || breadcrumbs.length <= 0) return <></>

        const items = breadcrumbs.map(breadcrumb => ({ text: breadcrumb, key: breadcrumb }) as IBreadcrumbItem)
        return <Breadcrumb styles={{ item: { fontSize: 12 } }} items={items}></Breadcrumb>
    }

    private observerMessages() {
        window.addEventListener('message', ev => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const command = ev.data.command
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const message = ev.data

            if (command === Webview.Cmd.Ui.editPostCfg) {
                const { post, activeTheme, personalCategories, siteCategories, tags, breadcrumbs, fileName } =
                    message as WebviewMsg.EditPostCfgMsg
                PersonalCategoryStore.set(personalCategories)
                SiteCategoryStore.set(siteCategories)
                TagStore.set(tags)

                this.setState({
                    theme: (activeTheme as number) === 2 ? darkTheme : lightTheme,
                    post,
                    breadcrumbs,
                    fileName,
                    useNestCategoriesSelect: personalCategories.some(c => c.childCount > 0),
                })
            } else if (command === Webview.Cmd.Ui.updateBreadcrumbs) {
                const { breadcrumbs } = message as WebviewMsg.UpdateBreadcrumbMsg
                this.setState({ breadcrumbs })
            } else if (command === Webview.Cmd.Ui.setFluentIconBaseUrl) {
                const { baseUrl } = message as WebviewMsg.SetFluentIconBaseUrlMsg
                initializeIcons(baseUrl)
            } else if (command === Webview.Cmd.Ui.updateTheme) {
                this.setState({ theme: ActiveThemeProvider.activeTheme() })
            }
        })
    }
}
