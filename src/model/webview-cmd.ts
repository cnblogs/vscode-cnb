import { PostCategories } from '@/model/post-category'

export namespace WebviewCmd {
    export enum UiCmd {
        editPostCfg = 'editPostCfg',
        showErrorResponse = 'showErrorResponse',
        updateBreadcrumbs = 'updateBreadcrumbs',
        updateImageUploadStatus = 'updateImageUploadStatus',
        setFluentIconBaseUrl = 'setFluentIconBaseUrl',
        updateTheme = 'updateTheme',
        updateChildCategories = 'updateChildCategories',
    }

    export enum ExtCmd {
        uploadPost = 'uploadPost',
        disposePanel = 'disposePanel',
        uploadImage = 'uploadImage',
        refreshPost = 'refreshPost',
        getChildCategories = 'getChildCategories',
    }

    export interface GetChildCategoriesPayload {
        parentId: number
    }

    export interface UpdateChildCategoriesPayload {
        parentId: number
        value: PostCategories
    }

    export namespace IngCmd {
        export enum UiCmd {
            setAppState = 'setAppState',
            updateTheme = 'updateTheme',
        }

        export enum ExtCmd {
            refreshingList = 'refreshingList',
            comment = 'comment',
        }

        export type CommentCmdPayload = {
            ingId: number
            atUser?: { id: number; displayName: string }
            parentCommentId?: number
            ingContent: string
        }
    }
}

export interface WebviewCommonCmd<T> {
    payload: T
    command: unknown
}

export interface IngWebviewUiCmd<T extends Record<string, unknown> = Record<string, unknown>>
    extends WebviewCommonCmd<T> {
    command: WebviewCmd.IngCmd.UiCmd
}

export interface IngWebviewHostCmd<T extends Record<string, unknown> = Record<string, unknown>>
    extends WebviewCommonCmd<T> {
    command: WebviewCmd.IngCmd.ExtCmd
}
