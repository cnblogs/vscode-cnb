import { Post } from './post';
import { webviewCommand } from './webview-command';
import { ColorThemeKind } from 'vscode';
import { PostCategories } from './post-category';
import { SiteCategories } from './site-category';
import { PostTags } from './post-tag';
import { IErrorResponse as ErrorResponse } from './error-response';
import { ImageUploadStatus } from './image-upload-status';

export namespace webviewMessage {
    export interface Message {
        command: webviewCommand.UiCommands | webviewCommand.ExtensionCommands;
    }

    /**
     * messages which post from the extension to the webview
     *
     * @export
     * @interface IUiMessage
     */
    export interface IUiMessage {}

    export interface EditPostConfigurationMessage extends Message {
        post: Post;
        activeTheme: ColorThemeKind;
        personalCategories: PostCategories;
        siteCategories: SiteCategories;
        tags: PostTags;
        breadcrumbs?: string[];
    }

    export interface SavePostMessage extends Message {
        post: Post;
    }

    export interface ShowErrorResponseMessage extends Message, IUiMessage {
        errorResponse: ErrorResponse;
    }

    export interface UpdateBreadcrumbsMessage extends Message, IUiMessage {
        breadcrumbs?: string[];
    }

    export interface UploadImageMessage extends Message {
        imageId: string;
    }

    export interface UpdateImageUpdateStatusMessage extends Message, IUiMessage {
        imageId: string;
        status: ImageUploadStatus;
    }

    export interface SetFluentIconBaseUrlMessage extends Message, IUiMessage {
        baseUrl: string;
    }

    export interface ChangeThemeMessage extends Message, IUiMessage {
        colorThemeKind: ColorThemeKind;
    }
}
