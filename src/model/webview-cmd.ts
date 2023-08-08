import { PostCategory } from '@/model/post-category'

export namespace Webview.Cmd {
    export enum Ui {
        editPostCfg = 'editPostCfg',
        showErrorResponse = 'showErrorResponse',
        updateBreadcrumbs = 'updateBreadcrumbs',
        updateImageUploadStatus = 'updateImageUploadStatus',
        setFluentIconBaseUrl = 'setFluentIconBaseUrl',
        updateTheme = 'updateTheme',
        updateChildCategories = 'updateChildCategories',
    }

    export enum Ext {
        uploadPost = 'uploadPost',
        disposePanel = 'disposePanel',
        uploadImg = 'uploadImg',
        refreshPost = 'refreshPost',
        getChildCategories = 'getChildCategories',
    }

    export type GetChildCategoriesPayload = {
        parentId: number
    }

    export type UpdateChildCategoriesPayload = {
        parentId: number
        value: PostCategory[]
    }

    export namespace Ing {
        export enum Ui {
            setAppState = 'setAppState',
            updateTheme = 'updateTheme',
        }

        export enum Ext {
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
    command: Webview.Cmd.Ing.Ui
}

export interface IngWebviewHostCmd<T extends Record<string, unknown> = Record<string, unknown>>
    extends WebviewCommonCmd<T> {
    command: Webview.Cmd.Ing.Ext
}
