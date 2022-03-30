import { cloneDeep } from 'lodash';
import vscode, { Uri } from 'vscode';
import path from 'path';
import fs from 'fs';
import { Post } from '../models/post';
import { globalState } from './global-state';
import { postCategoryService } from './post-category.service';
import { siteCategoryService } from './site-category.service';
import { postTagService } from './post-tag.service';
import { postService } from './post.service';
import { isErrorResponse } from '../models/error-response';
import { webviewMessage } from '../models/webview-message';
import { webviewCommand } from '../models/webview-command';
import { uploadImage } from '../commands/upload-image/upload-image';
import { ImageUploadStatusId } from '../models/image-upload-status';

const panels: Map<string, vscode.WebviewPanel> = new Map();

export namespace postConfigurationPanel {
    const uiName = 'post-configuration';
    interface PostConfigurationPanelOpenOption {
        post: Post;
        panelTitle?: string;
        localFileUri?: Uri;
        breadcrumbs?: string[];
    }
    const resourceRootUri = () =>
        vscode.Uri.file(path.join(globalState.extensionContext!.extensionPath, 'dist', 'assets'));

    const setHtml = async (webview: vscode.Webview): Promise<void> => {
        const webviewBaseUri = webview.asWebviewUri(resourceRootUri());
        webview.html = (
            await vscode.workspace.fs.readFile(vscode.Uri.joinPath(resourceRootUri(), 'ui', uiName, 'index.html'))
        )
            .toString()
            .replace(/@PWD/g, webviewBaseUri.toString());
    };

    export const buildPanelId = (postId: number, postTitle: string): string => `${postId}-${postTitle}`;
    export const findPanel = (panelId: string) => panels.get(panelId);

    export const open = async (
        option: PostConfigurationPanelOpenOption,
        successCallback: (post: Post) => any,
        beforeUpdate?: (postToUpdate: Post, panel: vscode.WebviewPanel) => Promise<boolean>
    ) => {
        let { post, panelTitle, localFileUri, breadcrumbs } = option;
        const { extensionContext } = globalState;
        if (!panelTitle) {
            panelTitle = `博文设置 - ${post.title}`;
        }
        if (localFileUri && fs.existsSync(localFileUri.fsPath)) {
            await vscode.commands.executeCommand('vscode.open', localFileUri, {
                preview: false,
                viewColumn: vscode.ViewColumn.One,
            } as vscode.TextDocumentShowOptions);
        }
        const panelId = buildPanelId(post.id, post.title);
        let panel = findPanel(panelId);
        if (revealPanel(panel, option)) {
            return;
        }
        panel = await createPanel(panelTitle, post);
        const { webview } = panel;
        webview.postMessage({
            command: webviewCommand.UiCommands.setFluentIconBaseUrl,
            baseUrl: webview.asWebviewUri(Uri.joinPath(resourceRootUri(), 'fonts')).toString() + '/',
        } as webviewMessage.SetFluentIconBaseUrlMessage);
        webview.postMessage({
            command: webviewCommand.UiCommands.editPostConfiguration,
            post: cloneDeep(post),
            activeTheme: vscode.window.activeColorTheme.kind,
            personalCategories: cloneDeep(await postCategoryService.fetchCategories()),
            siteCategories: cloneDeep(await siteCategoryService.fetchAll()),
            tags: cloneDeep(await postTagService.fetchTags()),
            breadcrumbs,
        } as webviewMessage.EditPostConfigurationMessage);
        webview.onDidReceiveMessage(
            async message => {
                const { command } = (message ?? {}) as webviewMessage.Message;
                switch (command) {
                    case webviewCommand.ExtensionCommands.savePost:
                        try {
                            if (!panel) {
                                return;
                            }
                            const { post: postToUpdate } = message as webviewMessage.SavePostMessage;
                            if (beforeUpdate) {
                                if (!(await beforeUpdate(postToUpdate, panel))) {
                                    panel.dispose();
                                    return;
                                }
                            }
                            const postSavedModel = await postService.updatePost(postToUpdate);
                            panel.dispose();
                            successCallback(Object.assign({}, postToUpdate, postSavedModel));
                        } catch (err) {
                            if (isErrorResponse(err)) {
                                webview.postMessage({
                                    command: webviewCommand.UiCommands.showErrorResponse,
                                    errorResponse: err,
                                } as webviewMessage.ShowErrorResponseMessage);
                            } else {
                                throw err;
                            }
                        }
                        break;
                    case webviewCommand.ExtensionCommands.disposePanel:
                        panel?.dispose();
                        break;
                    case webviewCommand.ExtensionCommands.uploadImage:
                        await handleUploadImageCommand(panel, message as any);
                        break;
                }
            },
            undefined,
            globalState.extensionContext?.subscriptions
        );
        panel.onDidDispose(
            () => {
                panels.delete(panelId);
                panel = undefined;
            },
            undefined,
            extensionContext!.subscriptions
        );
    };

    const revealPanel = (
        panel: vscode.WebviewPanel | null | undefined,
        options: PostConfigurationPanelOpenOption
    ): panel is vscode.WebviewPanel => {
        if (!panel) {
            return false;
        }
        try {
            const { breadcrumbs } = options;
            const { webview } = panel;
            webview.postMessage({
                command: webviewCommand.UiCommands.updateBreadcrumbs,
                breadcrumbs,
            } as webviewMessage.UpdateBreadcrumbsMessage);
            panel.reveal();
            return true;
        } catch {
            return false;
        }
    };

    const createPanel = async (panelTitle: string, post: Post): Promise<vscode.WebviewPanel> => {
        const panelId = buildPanelId(post.id, post.title);
        const panel = vscode.window.createWebviewPanel(panelId, panelTitle, vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        const { webview } = panel;
        await setHtml(webview);
        panel.iconPath = Uri.joinPath(globalState.extensionContext!.extensionUri, 'dist', 'assets', 'favicon.svg');
        panels.set(panelId, panel);
        return panel;
    };

    const handleUploadImageCommand = async (
        panel: vscode.WebviewPanel | undefined,
        message: webviewMessage.UploadImageMessage
    ) => {
        if (panel) {
            const { webview } = panel;
            webview.postMessage({
                command: webviewCommand.UiCommands.updateImageUploadStatus,
                status: {
                    id: ImageUploadStatusId.uploading,
                },
                imageId: message.imageId,
            } as webviewMessage.UpdateImageUpdateStatusMessage);
            try {
                const imageUrl = await uploadImage(false);
                webview.postMessage({
                    command: webviewCommand.UiCommands.updateImageUploadStatus,
                    status: {
                        imageUrl,
                        id: ImageUploadStatusId.uploaded,
                    },
                    imageId: message.imageId,
                } as webviewMessage.UpdateImageUpdateStatusMessage);
            } catch (err) {
                if (isErrorResponse(err)) {
                    webview.postMessage({
                        command: webviewCommand.UiCommands.updateImageUploadStatus,
                        status: {
                            id: ImageUploadStatusId.failed,
                            errors: err.errors,
                        },
                        imageId: message.imageId,
                    } as webviewMessage.UpdateImageUpdateStatusMessage);
                }
            }
        }
    };
}
