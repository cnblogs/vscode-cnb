import { Post } from './post'
import { Webview } from './webview-cmd'
import { ColorThemeKind } from 'vscode'
import { ImgUploadStatus } from './img-upload-status'
import { PostCat } from '@/model/post-cat'
import { SiteCat } from '@/model/site-category'
import { PostTag } from '@/wasm'

export namespace WebviewMsg {
    export type Msg = {
        command: Webview.Cmd.Ui | Webview.Cmd.Ext
    }

    export interface EditPostCfgMsg extends Msg {
        post: Post
        activeTheme: ColorThemeKind
        userCats: PostCat[]
        siteCats: SiteCat[]
        tags: PostTag[]
        breadcrumbs?: string[]
        fileName: string
    }

    export interface UploadPostMsg extends Msg {
        post: Post
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
