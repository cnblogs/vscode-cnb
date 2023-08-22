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
import { ActiveThemeProvider } from 'share/active-theme-provider'
import { darkTheme, lightTheme } from 'share/theme'
import { getVsCodeApiSingleton } from 'share/vscode-api'

type State = {
    post?: Post
    theme?: Theme | PartialTheme
    breadcrumbs?: string[]
    fileName: string
    useNestCategoriesSelect: boolean
}

export class App extends Component<unknown, State> {
    constructor(props: unknown) {
        super(props)
        this.state = {
            theme: ActiveThemeProvider.activeTheme(),
            fileName: '',
            useNestCategoriesSelect: false,
        }
        this.observerMessages()
        getVsCodeApiSingleton().postMessage({ command: Webview.Cmd.Ext.refreshPost })
    }

    render() {
        let content
        if (this.state.post === undefined) {
            content = (
                <Stack styles={{ root: { minHeight: '70vh' } }} verticalAlign="center">
                    <Spinner label="加载中..." labelPosition="bottom" />
                </Stack>
            )
        } else {
            const { fileName } = this.state
            content = (
                <>
                    {this.renderBreadcrumbs()}
                    <Stack tokens={{ padding: '8px 10px 16px 10px' }}>
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
                    </Stack>
                </>
            )
        }

        return (
            <React.StrictMode>
                <ThemeProvider theme={this.state.theme}>{content}</ThemeProvider>
            </React.StrictMode>
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
