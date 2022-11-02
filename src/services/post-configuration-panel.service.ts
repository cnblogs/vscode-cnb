import { cloneDeep } from 'lodash-es';
import vscode, { Uri } from 'vscode';
import path from 'path';
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
import { openPostFile } from '../commands/posts-list/open-post-file';

const panels: Map<string, vscode.WebviewPanel> = new Map();

export namespace postConfigurationPanel {
    const uiName = 'post-configuration';
    interface PostConfigurationPanelOpenOption {
        post: Post;
        panelTitle?: string;
        localFileUri?: Uri;
        breadcrumbs?: string[];
        successCallback: (post: Post) => any;
        beforeUpdate?: (postToUpdate: Post, panel: vscode.WebviewPanel) => Promise<boolean>;
    }
    const resourceRootUri = () =>
        vscode.Uri.file(path.join(globalState.extensionContext.extensionPath, 'dist', 'assets'));

    const setHtml = async (webview: vscode.Webview): Promise<void> => {
        const webviewBaseUri = webview.asWebviewUri(resourceRootUri());
        webview.html = (
            await vscode.workspace.fs.readFile(vscode.Uri.joinPath(resourceRootUri(), 'ui', uiName, 'index.html'))
        )
            .toString()
            .replace(/@PWD/g, webviewBaseUri.toString());
    };

    export const buildPanelId = (postId: number, postTitle: string): string => `${postId}-${postTitle}`;
    export const findPanelById = (panelId: string) => panels.get(panelId);
    export const open = async (option: PostConfigurationPanelOpenOption) => {
        const { post, breadcrumbs } = option;
        const panelTitle = option.panelTitle ? option.panelTitle : `博文设置 - ${post.title}`;
        await openPostFile(post, {
            viewColumn: vscode.ViewColumn.One,
        });
        const panelId = buildPanelId(post.id, post.title);
        let panel = tryRevealPanel(panelId, option);
        if (panel) return;

        const disposables: (vscode.Disposable | undefined)[] = [];
        panel = await createPanel(panelTitle, post);
        const { webview } = panel;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        webview.postMessage({
            command: webviewCommand.UiCommands.setFluentIconBaseUrl,
            baseUrl: webview.asWebviewUri(Uri.joinPath(resourceRootUri(), 'fonts')).toString() + '/',
        } as webviewMessage.SetFluentIconBaseUrlMessage);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        webview.postMessage({
            command: webviewCommand.UiCommands.editPostConfiguration,
            post: cloneDeep(post),
            activeTheme: vscode.window.activeColorTheme.kind,
            personalCategories: cloneDeep(await postCategoryService.fetchCategories()),
            siteCategories: cloneDeep(await siteCategoryService.fetchAll()),
            tags: cloneDeep(await postTagService.fetchTags()),
            breadcrumbs,
        } as webviewMessage.EditPostConfigurationMessage);
        disposables.push(
            observeWebviewMessages(panel, option),
            observeActiveColorSchemaChange(panel),
            observerPanelDisposeEvent(panel, disposables)
        );
    };

    const tryRevealPanel = (
        panelId: string | undefined,
        options: PostConfigurationPanelOpenOption
    ): vscode.WebviewPanel | undefined => {
        if (!panelId) return;

        const panel = findPanelById(panelId);
        if (!panel) return;

        try {
            const { breadcrumbs } = options;
            const { webview } = panel;
            void webview.postMessage({
                command: webviewCommand.UiCommands.updateBreadcrumbs,
                breadcrumbs,
            } as webviewMessage.UpdateBreadcrumbsMessage);
            panel.reveal();
        } catch {
            return undefined;
        }

        return panel;
    };

    const createPanel = async (panelTitle: string, post: Post): Promise<vscode.WebviewPanel> => {
        const panelId = buildPanelId(post.id, post.title);
        const panel = vscode.window.createWebviewPanel(panelId, panelTitle, vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        const { webview } = panel;
        await setHtml(webview);
        panel.iconPath = Uri.joinPath(globalState.extensionContext.extensionUri, 'dist', 'assets', 'favicon.svg');
        panels.set(panelId, panel);
        return panel;
    };

    const onUploadImageCommand = async (
        panel: vscode.WebviewPanel | undefined,
        message: webviewMessage.UploadImageMessage
    ) => {
        if (panel) {
            const { webview } = panel;
            await webview.postMessage({
                command: webviewCommand.UiCommands.updateImageUploadStatus,
                status: {
                    id: ImageUploadStatusId.uploading,
                },
                imageId: message.imageId,
            } as webviewMessage.UpdateImageUpdateStatusMessage);
            try {
                const imageUrl = await uploadImage(false);
                await webview.postMessage({
                    command: webviewCommand.UiCommands.updateImageUploadStatus,
                    status: {
                        imageUrl,
                        id: ImageUploadStatusId.uploaded,
                    },
                    imageId: message.imageId,
                } as webviewMessage.UpdateImageUpdateStatusMessage);
            } catch (err) {
                if (isErrorResponse(err)) {
                    await webview.postMessage({
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

    const observeActiveColorSchemaChange = (panel: vscode.WebviewPanel | undefined): vscode.Disposable | undefined => {
        if (!panel) return;

        const { webview } = panel;
        return vscode.window.onDidChangeActiveColorTheme(async theme => {
            await webview.postMessage({
                command: webviewCommand.UiCommands.changeTheme,
                colorThemeKind: theme.kind,
            } as webviewMessage.ChangeThemeMessage);
        });
    };

    const observeWebviewMessages = (
        panel: vscode.WebviewPanel | undefined,
        options: PostConfigurationPanelOpenOption
    ): vscode.Disposable | undefined => {
        if (!panel) return;

        const { webview } = panel;
        const { beforeUpdate, successCallback } = options;
        return webview.onDidReceiveMessage(async message => {
            const { command } = (message ?? {}) as webviewMessage.Message;
            switch (command) {
                case webviewCommand.ExtensionCommands.savePost:
                    try {
                        if (!panel) return;

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
                            await webview.postMessage({
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
                    await onUploadImageCommand(panel, <webviewMessage.UploadImageMessage>message);
                    break;
            }
        });
    };

    const observerPanelDisposeEvent = (
        panel: vscode.WebviewPanel | undefined,
        disposables: (vscode.Disposable | undefined)[]
    ): vscode.Disposable | undefined => {
        if (!panel) return;

        return panel.onDidDispose(() => {
            if (panel) {
                const panelId = panel.viewType;
                panels.delete(panelId);
                panel = undefined;
                disposables.forEach(disposable => void disposable?.dispose());
            }
        });
    };
}
