import { cloneDeep } from 'lodash-es'
import vscode, { Webview as CodeWebview, WebviewPanel, Uri, Disposable } from 'vscode'
import { Post } from '@/model/post'
import { globalCtx } from '@/ctx/global-ctx'
import { PostCatService } from './post-cat'
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
import { Token } from '@/wasm'
import { PostTagReq } from '@/wasm'
import { PostTag } from '@/wasm'
import { AuthManager } from '@/auth/auth-manager'

async function getAuthedPostTagReq() {
    const token = await AuthManager.acquireToken()
    // TODO: need better solution
    const isPatToken = token.length === 64
    return new PostTagReq(new Token(token, isPatToken))
}

const panels: Map<string, WebviewPanel> = new Map()

type PostCfgPanelOpenOption = {
    post: Post
    panelTitle?: string
    localFileUri?: Uri
    breadcrumbs: string[]
    afterSuccess: (post: Post) => any
    beforeUpdate: (postToUpdate: Post, panel: WebviewPanel) => Promise<boolean>
}

export namespace PostCfgPanel {
    export async function open(option: PostCfgPanelOpenOption) {
        const { post, breadcrumbs, localFileUri } = option
        const panelTitle = option.panelTitle !== undefined ? option.panelTitle : `博文设置 - ${post.title}`
        await openPostFile(post, {
            viewColumn: vscode.ViewColumn.One,
        })
        let panel = findPanelById(`${post.id}-${post.title}`)
        if (panel !== undefined) {
            revealPanel(panel, option)
            return
        }

        const panelId = `${post.id}-${post.title}`
        panel = vscode.window.createWebviewPanel(panelId, panelTitle, vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
        })
        panel.iconPath = Uri.joinPath(globalCtx.extCtx.extensionUri, 'dist', 'assets', 'favicon.svg')
        panels.set(panelId, panel)

        const webview = panel.webview

        let fileName: string
        if (localFileUri !== undefined) fileName = path.basename(localFileUri.fsPath, path.extname(localFileUri.fsPath))
        else fileName = ''

        const postTagReq = await getAuthedPostTagReq()
        const tags = (await postTagReq.getAll()) as PostTag[]

        const disposables: Disposable[] = []
        disposables.push(
            webview.onDidReceiveMessage(async ({ command }: WebviewMsg.Msg) => {
                if (command !== Webview.Cmd.Ext.refreshPost) return

                await webview.postMessage({
                    command: Webview.Cmd.Ui.setFluentIconBaseUrl,
                    baseUrl: webview.asWebviewUri(Uri.joinPath(globalCtx.assetsUri, 'fonts')).toString() + '/',
                } as WebviewMsg.SetFluentIconBaseUrlMsg)

                await webview.postMessage({
                    command: Webview.Cmd.Ui.editPostCfg,
                    post: cloneDeep(post),
                    activeTheme: vscode.window.activeColorTheme.kind,
                    userCats: cloneDeep(await PostCatService.getAll()),
                    siteCats: cloneDeep(await PostCatService.getSitePresetList()),
                    tags,
                    breadcrumbs,
                    fileName,
                } as WebviewMsg.EditPostCfgMsg)
            }),
            observeWebviewMsg(panel, option),
            observeThemeChange(webview),
            observePanelDispose(panel, disposables)
        )

        await setHtml(panel.webview)
    }
}
const setHtml = async (webview: vscode.Webview): Promise<void> => {
    webview.html = await parseWebviewHtml('post-cfg', webview)
}

export const findPanelById = (panelId: string) => panels.get(panelId)

const revealPanel = (panel: WebviewPanel, options: PostCfgPanelOpenOption) => {
    const { breadcrumbs } = options
    const { webview } = panel
    void webview.postMessage({
        command: Webview.Cmd.Ui.updateBreadcrumbs,
        breadcrumbs,
    } as WebviewMsg.UpdateBreadcrumbMsg)
    panel.reveal()
}

const doUploadImg = async (webview: CodeWebview, message: WebviewMsg.UploadImgMsg) => {
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

const observeThemeChange = (webview: CodeWebview) =>
    vscode.window.onDidChangeActiveColorTheme(async theme => {
        await webview.postMessage({
            command: Webview.Cmd.Ui.updateTheme,
            colorThemeKind: theme.kind,
        } as WebviewMsg.ChangeThemeMsg)
    })

const observeWebviewMsg = (panel: WebviewPanel, options: PostCfgPanelOpenOption) => {
    const { webview } = panel
    const { beforeUpdate, afterSuccess } = options
    return webview.onDidReceiveMessage(async message => {
        const { command } = message as WebviewMsg.Msg

        if (command === Webview.Cmd.Ext.uploadPost) {
            const { post } = message as WebviewMsg.UploadPostMsg

            if (!(await beforeUpdate(post, panel))) return

            try {
                const postSavedModel = await PostService.update(post)
                panel.dispose()
                afterSuccess(Object.assign({}, post, postSavedModel))
            } catch (e) {
                void Alert.err(`操作失败: ${<string>e}`)
            }
            return
        } else if (command === Webview.Cmd.Ext.disposePanel) {
            panel.dispose()
        } else if (command === Webview.Cmd.Ext.uploadImg) {
            await doUploadImg(webview, <WebviewMsg.UploadImgMsg>message)
        } else if (command === Webview.Cmd.Ext.getChildCategories) {
            const { payload } = message as WebviewCommonCmd<Webview.Cmd.GetChildCategoriesPayload>
            await webview.postMessage({
                command: Webview.Cmd.Ui.updateChildCategories,
                payload: {
                    value: await PostCatService.getAllUnder(payload.parentId).catch(() => []),
                    parentId: payload.parentId,
                },
            })
        }
    })
}

const observePanelDispose = (panel: WebviewPanel, disposables: Disposable[]) =>
    panel.onDidDispose(() => {
        const panelId = panel.viewType
        panels.delete(panelId)
        disposables.forEach(disposable => void disposable?.dispose())
    })
