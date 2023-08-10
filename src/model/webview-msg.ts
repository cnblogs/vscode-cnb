import { Post } from './post'
import { Webview } from './webview-cmd'
import { ColorThemeKind } from 'vscode'
import { PostTags } from './post-tag'
import { IErrorResponse as ErrorResponse } from './error-response'
import { ImgUploadStatus } from './img-upload-status'
import { SiteCategory } from '@/model/site-category'
import { PostCategory } from '@/model/post-category'

export namespace WebviewMsg {
    export type Msg = {
        command: Webview.Cmd.Ui | Webview.Cmd.Ext
    }

    export interface EditPostCfgMsg extends Msg {
        post: Post
        activeTheme: ColorThemeKind
        personalCategories: PostCategory[]
        siteCategories: SiteCategory[]
        tags: PostTags
        breadcrumbs?: string[]
        fileName: string
    }

    export interface UploadPostMsg extends Msg {
        post: Post
    }

    export interface ShowErrRespMsg extends Msg {
        errorResponse: ErrorResponse
    }

    export interface UpdateBreadcrumbMsg extends Msg {
        breadcrumbs?: string[]
    }

    export interface UploadImgMsg extends Msg {
        imageId: string
    }

    export interface UpdateImgUpdateStatusMsg extends Msg {
        imageId: string
        status: ImgUploadStatus
    }

    export interface SetFluentIconBaseUrlMsg extends Msg {
        baseUrl: string
    }

    export interface ChangeThemeMsg extends Msg {
        colorThemeKind: ColorThemeKind
    }
}
