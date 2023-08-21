import { cloneDeep } from 'lodash-es'
import vscode, { WebviewPanel, Uri } from 'vscode'
import { Post } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PostCategoryService } from './post-category'
import { PostTagService } from './post-tag'
import { PostService } from './post'
import { WebviewMsg } from '@/model/webview-msg'
import { WebviewCommonCmd, Webview } from '@/model/webview-cmd'
import { ImgUploadStatusId } from '@/model/img-upload-status'
import { openPostFile } from '@/cmd/post-list/open-post-file'
import { parseWebviewHtml } from '@/service/parse-webview-html'
import path from 'path'
import { Alert } from '@/infra/alert'
import { uploadFsImage } from '@/cmd/upload-img/upload-fs-img'
import { uploadClipboardImg } from '@/cmd/upload-img/upload-clipboard-img'

const panels: Map<string, WebviewPanel> = new Map()

type PostCfgPanelOpenOption = {
    post: Post
    panelTitle?: string
    localFileUri?: Uri
    breadcrumbs?: string[]
    afterSuccess: (post: Post) => any
    beforeUpdate?: (postToUpdate: Post, panel: WebviewPanel) => Promise<boolean>
}

export namespace PostCfgPanel {
    const setHtml = async (webview: vscode.Webview): Promise<void> => {
        webview.html = await parseWebviewHtml('post-cfg', webview)
    }

    export const buildPanelId = (postId: number, postTitle: string): string => `${postId}-${postTitle}`
    export const findPanelById = (panelId: string) => panels.get(panelId)

    export async function open(option: PostCfgPanelOpenOption) {
        const { post, breadcrumbs, localFileUri } = option
        const panelTitle = option.panelTitle !== undefined ? option.panelTitle : `博文设置 - ${post.title}`
        await openPostFile(post, {
            viewColumn: vscode.ViewColumn.One,
        })
        const panelId = buildPanelId(post.id, post.title)
        let panel = tryRevealPanel(panelId, option)
        if (panel) return

        const disposables: (vscode.Disposable | undefined)[] = []
        panel = await createPanel(panelTitle, post)
        const { webview } = panel

        let fileName: string
        if (localFileUri !== undefined) fileName = path.basename(localFileUri.fsPath, path.extname(localFileUri.fsPath))
        else fileName = ''

        disposables.push(
            panel.webview.onDidReceiveMessage(async ({ command }: WebviewMsg.Msg) => {
                console.log(command)
                if (command !== Webview.Cmd.Ext.refreshPost) return

                await webview.postMessage({
                    command: Webview.Cmd.Ui.setFluentIconBaseUrl,
                    baseUrl: webview.asWebviewUri(Uri.joinPath(globalCtx.assetsUri, 'fonts')).toString() + '/',
                } as WebviewMsg.SetFluentIconBaseUrlMsg)
                await webview.postMessage({
                    command: Webview.Cmd.Ui.editPostCfg,
                    post: cloneDeep(post),
                    activeTheme: vscode.window.activeColorTheme.kind,
                    personalCategories: cloneDeep(await PostCategoryService.getAll()),
                    siteCategories: cloneDeep(await PostCategoryService.getSitePresetList()),
                    tags: cloneDeep(await PostTagService.fetchTags()),
                    breadcrumbs,
                    fileName,
                } as WebviewMsg.EditPostCfgMsg)
            }),
            observeWebviewMessages(panel, option),
            observeActiveColorSchemaChange(panel),
            observerPanelDisposeEvent(panel, disposables)
        )
    }

    const tryRevealPanel = (panelId: string, options: PostCfgPanelOpenOption): WebviewPanel | undefined => {
        const panel = findPanelById(panelId)
        if (panel === undefined) return

        try {
            const { breadcrumbs } = options
            const { webview } = panel
            void webview.postMessage({
                command: Webview.Cmd.Ui.updateBreadcrumbs,
                breadcrumbs,
            } as WebviewMsg.UpdateBreadcrumbMsg)
            panel.reveal()
        } catch {
            return undefined
        }

        return panel
    }

    const createPanel = async (panelTitle: string, post: Post): Promise<WebviewPanel> => {
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

    const onUploadImageCmd = async (panel: WebviewPanel, message: WebviewMsg.UploadImgMsg) => {
        const { webview } = panel

        const selected = await Alert.info(
            '上传图片到博客园',
            {
                modal: true,
                detail: '选择图片来源',
            },
            '本地图片',
            '剪贴板图片'
        )
        if (selected === undefined) return

        try {
            let imageUrl: string | undefined

            if (selected === '本地图片') imageUrl = await uploadFsImage()
            else if (selected === '剪贴板图片') imageUrl = await uploadClipboardImg()

            if (imageUrl === undefined) return

            await webview.postMessage({
                command: Webview.Cmd.Ui.updateImageUploadStatus,
                status: {
                    imageUrl,
                    id: ImgUploadStatusId.uploaded,
                },
                imageId: message.imageId,
            } as WebviewMsg.UpdateImgUpdateStatusMsg)
        } catch (e) {
            void Alert.err(`操作失败: {<string> e}`)
        }
    }

    const observeActiveColorSchemaChange = (panel: WebviewPanel) => {
        const { webview } = panel
        return vscode.window.onDidChangeActiveColorTheme(async theme => {
            await webview.postMessage({
                command: Webview.Cmd.Ui.updateTheme,
                colorThemeKind: theme.kind,
            } as WebviewMsg.ChangeThemeMsg)
        })
    }

    const observeWebviewMessages = (
        panel: WebviewPanel | undefined,
        options: PostCfgPanelOpenOption
    ): vscode.Disposable | undefined => {
        if (panel === undefined) return

        const { webview } = panel
        const { beforeUpdate, afterSuccess } = options
        return webview.onDidReceiveMessage(async message => {
            const { command } = message as WebviewMsg.Msg

            if (command === Webview.Cmd.Ext.uploadPost) {
                const { post } = message as WebviewMsg.UploadPostMsg

                if (beforeUpdate !== undefined && !(await beforeUpdate(post, panel))) return

                const postSavedModel = await PostService.update(post)
                panel.dispose()
                afterSuccess(Object.assign({}, post, postSavedModel))
                return
            } else if (command === Webview.Cmd.Ext.disposePanel) {
                panel.dispose()
            } else if (command === Webview.Cmd.Ext.uploadImg) {
                await onUploadImageCmd(panel, <WebviewMsg.UploadImgMsg>message)
            } else if (command === Webview.Cmd.Ext.getChildCategories) {
                const { payload } = message as WebviewCommonCmd<Webview.Cmd.GetChildCategoriesPayload>
                await webview.postMessage({
                    command: Webview.Cmd.Ui.updateChildCategories,
                    payload: {
                        value: await PostCategoryService.getAllUnder(payload.parentId).catch(() => []),
                        parentId: payload.parentId,
                    },
                })
            }
        })
    }

    const observerPanelDisposeEvent = (
        panel: WebviewPanel | undefined,
        disposables: (vscode.Disposable | undefined)[]
    ): vscode.Disposable | undefined => {
        if (panel === undefined) return

        return panel.onDidDispose(() => {
            if (panel === undefined) return

            const panelId = panel.viewType
            panels.delete(panelId)
            panel = undefined
            disposables.forEach(disposable => void disposable?.dispose())
        })
    }
}
