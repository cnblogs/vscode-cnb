import { cloneDeep } from 'lodash-es'
import vscode, { Uri } from 'vscode'
import { Post } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PostCategoryService } from './post-category'
import { SiteCategoryService } from './site-category'
import { PostTagService } from './post-tag'
import { PostService } from './post'
import { isErrorResponse } from '@/model/error-response'
import { webviewMessage } from '@/model/webview-msg'
import { WebviewCommonCmd, WebviewCmd } from '@/model/webview-cmd'
import { uploadImg } from '@/cmd/upload-img/upload-img'
import { ImgUploadStatusId } from '@/model/img-upload-status'
import { openPostFile } from '@/cmd/post-list/open-post-file'
import { parseWebviewHtml } from '@/service/parse-webview-html'
import path from 'path'

const panels: Map<string, vscode.WebviewPanel> = new Map()

export namespace PostCfgPanel {
    interface PostCfgPanelOpenOption {
        post: Post
        panelTitle?: string
        localFileUri?: Uri
        breadcrumbs?: string[]
        successCallback: (post: Post) => any
        beforeUpdate?: (postToUpdate: Post, panel: vscode.WebviewPanel) => Promise<boolean>
    }

    const resourceRootUri = () => globalCtx.assetsUri

    const setHtml = async (webview: vscode.Webview): Promise<void> => {
        webview.html = await parseWebviewHtml('post-cfg', webview)
    }

    export const buildPanelId = (postId: number, postTitle: string): string => `${postId}-${postTitle}`
    export const findPanelById = (panelId: string) => panels.get(panelId)
    export const open = async (option: PostCfgPanelOpenOption) => {
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
                if (command === WebviewCmd.ExtCmd.refreshPost) {
                    await webview.postMessage({
                        command: WebviewCmd.UiCmd.setFluentIconBaseUrl,
                        baseUrl: webview.asWebviewUri(Uri.joinPath(resourceRootUri(), 'fonts')).toString() + '/',
                    } as webviewMessage.SetFluentIconBaseUrlMessage)
                    await webview.postMessage({
                        command: WebviewCmd.UiCmd.editPostCfg,
                        post: cloneDeep(post),
                        activeTheme: vscode.window.activeColorTheme.kind,
                        personalCategories: cloneDeep(await PostCategoryService.listCategories()),
                        siteCategories: cloneDeep(await SiteCategoryService.fetchAll()),
                        tags: cloneDeep(await PostTagService.fetchTags()),
                        breadcrumbs,
                        fileName: localFileUri
                            ? path.basename(localFileUri.fsPath, path.extname(localFileUri?.fsPath))
                            : '',
                    } as webviewMessage.EditPostCfgMessage)
                }
            }),
            observeWebviewMessages(panel, option),
            observeActiveColorSchemaChange(panel),
            observerPanelDisposeEvent(panel, disposables)
        )
    }

    const tryRevealPanel = (
        panelId: string | undefined,
        options: PostCfgPanelOpenOption
    ): vscode.WebviewPanel | undefined => {
        if (!panelId) return

        const panel = findPanelById(panelId)
        if (!panel) return

        try {
            const { breadcrumbs } = options
            const { webview } = panel
            void webview.postMessage({
                command: WebviewCmd.UiCmd.updateBreadcrumbs,
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
        panel.iconPath = Uri.joinPath(globalCtx.extCtx.extensionUri, 'dist', 'assets', 'favicon.svg')
        panels.set(panelId, panel)
        return panel
    }

    const onUploadImageCmd = async (
        panel: vscode.WebviewPanel | undefined,
        message: webviewMessage.UploadImageMessage
    ) => {
        if (panel) {
            const { webview } = panel
            await webview.postMessage({
                command: WebviewCmd.UiCmd.updateImageUploadStatus,
                status: {
                    id: ImgUploadStatusId.uploading,
                },
                imageId: message.imageId,
            } as webviewMessage.UpdateImageUpdateStatusMessage)
            try {
                const imageUrl = await uploadImg(false)
                await webview.postMessage({
                    command: WebviewCmd.UiCmd.updateImageUploadStatus,
                    status: {
                        imageUrl,
                        id: ImgUploadStatusId.uploaded,
                    },
                    imageId: message.imageId,
                } as webviewMessage.UpdateImageUpdateStatusMessage)
            } catch (err) {
                if (isErrorResponse(err)) {
                    await webview.postMessage({
                        command: WebviewCmd.UiCmd.updateImageUploadStatus,
                        status: {
                            id: ImgUploadStatusId.failed,
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
                command: WebviewCmd.UiCmd.updateTheme,
                colorThemeKind: theme.kind,
            } as webviewMessage.ChangeThemeMessage)
        })
    }

    const observeWebviewMessages = (
        panel: vscode.WebviewPanel | undefined,
        options: PostCfgPanelOpenOption
    ): vscode.Disposable | undefined => {
        if (!panel) return

        const { webview } = panel
        const { beforeUpdate, successCallback } = options
        return webview.onDidReceiveMessage(async message => {
            const { command } = (message ?? {}) as webviewMessage.Message
            switch (command) {
                case WebviewCmd.ExtCmd.uploadPost:
                    try {
                        if (!panel) return

                        const { post: postToUpdate } = message as webviewMessage.UploadPostMessage
                        if (beforeUpdate) {
                            if (!(await beforeUpdate(postToUpdate, panel))) {
                                panel.dispose()
                                return
                            }
                        }
                        const postSavedModel = await PostService.updatePost(postToUpdate)
                        panel.dispose()
                        successCallback(Object.assign({}, postToUpdate, postSavedModel))
                    } catch (err) {
                        if (isErrorResponse(err)) {
                            await webview.postMessage({
                                command: WebviewCmd.UiCmd.showErrorResponse,
                                errorResponse: err,
                            } as webviewMessage.ShowErrorResponseMessage)
                        } else {
                            throw err
                        }
                    }
                    break
                case WebviewCmd.ExtCmd.disposePanel:
                    panel?.dispose()
                    break
                case WebviewCmd.ExtCmd.uploadImg:
                    await onUploadImageCmd(panel, <webviewMessage.UploadImageMessage>message)
                    break
                case WebviewCmd.ExtCmd.getChildCategories:
                    {
                        const { payload } = message as WebviewCommonCmd<WebviewCmd.GetChildCategoriesPayload>
                        await webview.postMessage({
                            command: WebviewCmd.UiCmd.updateChildCategories,
                            payload: {
                                value: await PostCategoryService.listCategories({ parentId: payload.parentId }).catch(
                                    () => []
                                ),
                                parentId: payload.parentId,
                            },
                        } as WebviewCommonCmd<WebviewCmd.UpdateChildCategoriesPayload>)
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
