import { PostCat } from '@/model/post-cat'

export namespace Webview.Cmd {
    export enum Ui {
        editPostCfg = 'editPostCfg',
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

    export interface GetChildCategoriesPayload {
        parentId: number
    }

    export interface UpdateChildCategoriesPayload {
        parentId: number
        value: PostCat[]
    }

    export namespace Ing {
        export enum Ui {
            setAppState = 'setAppState',
            updateTheme = 'updateTheme',
        }

        export enum Ext {
            reload = 'reload',
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
