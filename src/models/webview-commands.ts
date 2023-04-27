export namespace webviewCommands {
    export enum UiCommands {
        editPostConfiguration = 'editPostConfiguration',
        showErrorResponse = 'showErrorResponse',
        updateBreadcrumbs = 'updateBreadcrumbs',
        updateImageUploadStatus = 'updateImageUploadStatus',
        setFluentIconBaseUrl = 'setFluentIconBaseUrl',
        updateTheme = 'updateTheme',
    }

    export enum ExtensionCommands {
        savePost = 'savePost',
        disposePanel = 'disposePanel',
        uploadImage = 'uploadImage',
        refreshPost = 'refreshPost',
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

interface WebviewCommonCommand<T> {
    payload: T;
}

export interface IngWebviewUiCommand<T extends Record<string, unknown> = Record<string, unknown>>
    extends WebviewCommonCommand<T> {
    command: webviewCommands.ingCommands.UiCommands;
}

export interface IngWebviewHostCommand<T extends Record<string, unknown> = Record<string, unknown>>
    extends WebviewCommonCommand<T> {
    command: webviewCommands.ingCommands.ExtensionCommands;
}
