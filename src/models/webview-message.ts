import { Post } from './post';
import { webviewCommands } from './webview-commands';
import { ColorThemeKind } from 'vscode';
import { PostCategories } from './post-category';
import { SiteCategories } from './site-category';
import { PostTags } from './post-tag';
import { IErrorResponse as ErrorResponse } from './error-response';
import { ImageUploadStatus } from './image-upload-status';

export namespace webviewMessage {
    export interface Message {
        command: webviewCommands.UiCommands | webviewCommands.ExtensionCommands;
    }

    export interface EditPostConfigurationMessage extends Message {
        post: Post;
        activeTheme: ColorThemeKind;
        personalCategories: PostCategories;
        siteCategories: SiteCategories;
        tags: PostTags;
        breadcrumbs?: string[];
        fileName: string;
    }

    export interface SavePostMessage extends Message {
        post: Post;
    }

    export interface ShowErrorResponseMessage extends Message {
        errorResponse: ErrorResponse;
    }

    export interface UpdateBreadcrumbsMessage extends Message {
        breadcrumbs?: string[];
    }

    export interface UploadImageMessage extends Message {
        imageId: string;
    }

    export interface UpdateImageUpdateStatusMessage extends Message {
        imageId: string;
        status: ImageUploadStatus;
    }

    export interface SetFluentIconBaseUrlMessage extends Message {
        baseUrl: string;
    }

    export interface ChangeThemeMessage extends Message {
        colorThemeKind: ColorThemeKind;
    }
}
