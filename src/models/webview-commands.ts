import { PostCategories } from '@/models/post-category';

export namespace webviewCommands {
    export enum UiCommands {
        editPostConfiguration = 'editPostConfiguration',
        showErrorResponse = 'showErrorResponse',
        updateBreadcrumbs = 'updateBreadcrumbs',
        updateImageUploadStatus = 'updateImageUploadStatus',
        setFluentIconBaseUrl = 'setFluentIconBaseUrl',
        updateTheme = 'updateTheme',
        updateChildCategories = 'updateChildCategories',
    }

    export enum ExtensionCommands {
        savePost = 'savePost',
        disposePanel = 'disposePanel',
        uploadImage = 'uploadImage',
        refreshPost = 'refreshPost',
        getChildCategories = 'getChildCategories',
    }

    export interface GetChildCategoriesPayload {
        parentId: number;
    }

    export interface UpdateChildCategoriesPayload {
        parentId: number;
        value: PostCategories;
    }

    export namespace ingCommands {
        export enum UiCommands {
            setAppState = 'setAppState',
            updateTheme = 'updateTheme',
        }

        export enum ExtensionCommands {
            refreshIngsList = 'refreshIngsList',
            comment = 'comment',
        }

        export type CommentCommandPayload = {
            ingId: number;
            atUser?: { id: number; displayName: string };
            parentCommentId?: number;
            ingContent: string;
        };
    }
}

export interface WebviewCommonCommand<T> {
    payload: T;
    command: unknown;
}

export interface IngWebviewUiCommand<T extends Record<string, unknown> = Record<string, unknown>>
    extends WebviewCommonCommand<T> {
    command: webviewCommands.ingCommands.UiCommands;
}

export interface IngWebviewHostCommand<T extends Record<string, unknown> = Record<string, unknown>>
    extends WebviewCommonCommand<T> {
    command: webviewCommands.ingCommands.ExtensionCommands;
}
