import { cloneDeep } from 'lodash-es'
import vscode, { Uri } from 'vscode'
import { Post } from '@/models/post'
import { globalCtx } from './global-state'
import { postCategoryService } from './post-category.service'
import { siteCategoryService } from './site-category.service'
import { postTagService } from './post-tag.service'
import { postService } from './post.service'
import { isErrorResponse } from '@/models/error-response'
import { webviewMessage } from '@/models/webview-message'
import { WebviewCommonCommand, webviewCommands } from 'src/models/webview-commands'
import { uploadImage } from '@/commands/upload-image/upload-image'
import { ImageUploadStatusId } from '@/models/image-upload-status'
import { openPostFile } from '@/commands/posts-list/open-post-file'
import { parseWebviewHtml } from 'src/services/parse-webview-html'
import path from 'path'

const panels: Map<string, vscode.WebviewPanel> = new Map()

export namespace postConfigurationPanel {
    interface PostConfigurationPanelOpenOption {
        post: Post
        panelTitle?: string
        localFileUri?: Uri
        breadcrumbs?: string[]
        successCallback: (post: Post) => any
        beforeUpdate?: (postToUpdate: Post, panel: vscode.WebviewPanel) => Promise<boolean>
    }

    const resourceRootUri = () => globalCtx.assetsUri

    const setHtml = async (webview: vscode.Webview): Promise<void> => {
        webview.html = await parseWebviewHtml('post-configuration', webview)
    }

    export const buildPanelId = (postId: number, postTitle: string): string => `${postId}-${postTitle}`
    export const findPanelById = (panelId: string) => panels.get(panelId)
    export const open = async (option: PostConfigurationPanelOpenOption) => {
        const { post, breadcrumbs, localFileUri } = option
        const panelTitle = option.panelTitle ? option.panelTitle : `博文设置 - ${post.title}`
        await openPostFile(post, {
            viewColumn: vscode.ViewColumn.One,
        })
        const panelId = buildPanelId(post.id, post.title)
        let panel = tryRevealPanel(panelId, option)
        if (panel) return

        const disposables: (vscode.Disposable | undefined)[] = []
        panel = await createPanel(panelTitle, post)
        const { webview } = panel

        disposables.push(
            webview.onDidReceiveMessage(async ({ command }: webviewMessage.Message) => {
                if (command === webviewCommands.ExtensionCommands.refreshPost) {
                    await webview.postMessage({
                        command: webviewCommands.UiCommands.setFluentIconBaseUrl,
                        baseUrl: webview.asWebviewUri(Uri.joinPath(resourceRootUri(), 'fonts')).toString() + '/',
                    } as webviewMessage.SetFluentIconBaseUrlMessage)
                    await webview.postMessage({
                        command: webviewCommands.UiCommands.editPostConfiguration,
                        post: cloneDeep(post),
                        activeTheme: vscode.window.activeColorTheme.kind,
                        personalCategories: cloneDeep(await postCategoryService.listCategories()),
                        siteCategories: cloneDeep(await siteCategoryService.fetchAll()),
                        tags: cloneDeep(await postTagService.fetchTags()),
                        breadcrumbs,
                        fileName: localFileUri
                            ? path.basename(localFileUri.fsPath, path.extname(localFileUri?.fsPath))
                            : '',
                    } as webviewMessage.EditPostConfigurationMessage)
                }
            }),
            observeWebviewMessages(panel, option),
            observeActiveColorSchemaChange(panel),
            observerPanelDisposeEvent(panel, disposables)
        )
    }

    const tryRevealPanel = (
        panelId: string | undefined,
        options: PostConfigurationPanelOpenOption
    ): vscode.WebviewPanel | undefined => {
        if (!panelId) return

        const panel = findPanelById(panelId)
        if (!panel) return

        try {
            const { breadcrumbs } = options
            const { webview } = panel
            void webview.postMessage({
                command: webviewCommands.UiCommands.updateBreadcrumbs,
                breadcrumbs,
            } as webviewMessage.UpdateBreadcrumbsMessage)
            panel.reveal()
        } catch {
            return undefined
        }

        return panel
    }

    const createPanel = async (panelTitle: string, post: Post): Promise<vscode.WebviewPanel> => {
        const panelId = buildPanelId(post.id, post.title)
        const panel = vscode.window.createWebviewPanel(panelId, panelTitle, vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
        })
        const { webview } = panel
        await setHtml(webview)
        panel.iconPath = Uri.joinPath(globalCtx.extensionContext.extensionUri, 'dist', 'assets', 'favicon.svg')
        panels.set(panelId, panel)
        return panel
    }

    const onUploadImageCommand = async (
        panel: vscode.WebviewPanel | undefined,
        message: webviewMessage.UploadImageMessage
    ) => {
        if (panel) {
            const { webview } = panel
            await webview.postMessage({
                command: webviewCommands.UiCommands.updateImageUploadStatus,
                status: {
                    id: ImageUploadStatusId.uploading,
                },
                imageId: message.imageId,
            } as webviewMessage.UpdateImageUpdateStatusMessage)
            try {
                const imageUrl = await uploadImage(false)
                await webview.postMessage({
                    command: webviewCommands.UiCommands.updateImageUploadStatus,
                    status: {
                        imageUrl,
                        id: ImageUploadStatusId.uploaded,
                    },
                    imageId: message.imageId,
                } as webviewMessage.UpdateImageUpdateStatusMessage)
            } catch (err) {
                if (isErrorResponse(err)) {
                    await webview.postMessage({
                        command: webviewCommands.UiCommands.updateImageUploadStatus,
                        status: {
                            id: ImageUploadStatusId.failed,
                            errors: err.errors,
                        },
                        imageId: message.imageId,
                    } as webviewMessage.UpdateImageUpdateStatusMessage)
                }
            }
        }
    }

    const observeActiveColorSchemaChange = (panel: vscode.WebviewPanel | undefined): vscode.Disposable | undefined => {
        if (!panel) return

        const { webview } = panel
        return vscode.window.onDidChangeActiveColorTheme(async theme => {
            await webview.postMessage({
                command: webviewCommands.UiCommands.updateTheme,
                colorThemeKind: theme.kind,
            } as webviewMessage.ChangeThemeMessage)
        })
    }

    const observeWebviewMessages = (
        panel: vscode.WebviewPanel | undefined,
        options: PostConfigurationPanelOpenOption
    ): vscode.Disposable | undefined => {
        if (!panel) return

        const { webview } = panel
        const { beforeUpdate, successCallback } = options
        return webview.onDidReceiveMessage(async message => {
            const { command } = (message ?? {}) as webviewMessage.Message
            switch (command) {
                case webviewCommands.ExtensionCommands.uploadPost:
                    try {
                        if (!panel) return

                        const { post: postToUpdate } = message as webviewMessage.UploadPostMessage
                        if (beforeUpdate) {
                            if (!(await beforeUpdate(postToUpdate, panel))) {
                                panel.dispose()
                                return
                            }
                        }
                        const postSavedModel = await postService.updatePost(postToUpdate)
                        panel.dispose()
                        successCallback(Object.assign({}, postToUpdate, postSavedModel))
                    } catch (err) {
                        if (isErrorResponse(err)) {
                            await webview.postMessage({
                                command: webviewCommands.UiCommands.showErrorResponse,
                                errorResponse: err,
                            } as webviewMessage.ShowErrorResponseMessage)
                        } else {
                            throw err
                        }
                    }
                    break
                case webviewCommands.ExtensionCommands.disposePanel:
                    panel?.dispose()
                    break
                case webviewCommands.ExtensionCommands.uploadImage:
                    await onUploadImageCommand(panel, <webviewMessage.UploadImageMessage>message)
                    break
                case webviewCommands.ExtensionCommands.getChildCategories:
                    {
                        const { payload } = message as WebviewCommonCommand<webviewCommands.GetChildCategoriesPayload>
                        await webview.postMessage({
                            command: webviewCommands.UiCommands.updateChildCategories,
                            payload: {
                                value: await postCategoryService
                                    .listCategories({ parentId: payload.parentId })
                                    .catch(() => []),
                                parentId: payload.parentId,
                            },
                        } as WebviewCommonCommand<webviewCommands.UpdateChildCategoriesPayload>)
                    }
                    break
            }
        })
    }

    const observerPanelDisposeEvent = (
        panel: vscode.WebviewPanel | undefined,
        disposables: (vscode.Disposable | undefined)[]
    ): vscode.Disposable | undefined => {
        if (!panel) return

        return panel.onDidDispose(() => {
            if (panel) {
                const panelId = panel.viewType
                panels.delete(panelId)
                panel = undefined
                disposables.forEach(disposable => void disposable?.dispose())
            }
        })
    }
}
