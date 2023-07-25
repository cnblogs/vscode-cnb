import { openMyAccountSettings } from './open/open-my-account-settings'
import { openMyWebBlogConsole } from './open/open-my-blog-console'
import { openMyHomePage } from './open/open-my-home-page'
import { login, logout } from './login'
import { openMyBlog } from './open/open-my-blog'
import { globalCtx } from '@/services/global-ctx'
import { gotoNextPostList, gotoPreviousPostList, refreshPostList, seekPostList } from './post-list/refresh-post-list'
import { uploadPostFileToCnblogs, uploadPostToCnblogs } from './post-list/upload-post'
import { createLocalDraft } from './post-list/create-local-draft'
import { deleteSelectedPost } from './post-list/delete-post'
import { modifyPostSettings } from './post-list/modify-post-settings'
import { uploadImage } from './upload-image/upload-image'
import { revealLocalPostFileInOs } from './reveal-local-post-file-in-os'
import { showLocalFileToPostInfo } from './show-local-file-to-post-info'
import { newPostCategory } from './post-category/new-post-category'
import { refreshPostCategoriesList } from './post-category/refresh-post-categories-list'
import { handleUpdatePostCategory } from './post-category/update-post-category'
import { openPostInVscode } from './post-list/open-post-in-vscode'
import { deletePostToLocalFileMap } from './post-list/delete-post-to-local-file-map'
import { renamePost } from './post-list/rename-post'
import { openPostInBlogAdmin } from './open/open-post-in-blog-admin'
import { openWorkspace } from './open/open-workspace'
import { setWorkspace } from './set-workspace'
import { revealWorkspaceInOs } from './reveal-workspace-in-os'
import { viewPostOnline } from './view-post-online'
import { pullPostRemoteUpdates } from './pull-post-remote-updates'
import { extractImages } from './extract-images'
import { clearPostSearchResults, refreshPostSearchResults, searchPost } from './post-list/search'
import { handleDeletePostCategories } from './post-category/delete-selected-categories'
import { PublishIngCmdHandler } from '@/commands/ing/publish-ing'
import { regIngListCmds } from 'src/commands/ing/ing-list-cmd-register'
import { CopyPostLinkCmdHandler } from '@/commands/post-list/copy-link'
import { regBlogExportCmds } from '@/commands/blog-export'
import { regCmd } from '@/utils/cmd'
import { exportPostToPdf } from '@/commands/pdf/export-pdf'
import { openCnbHome } from '@/commands/open/open-cnb-home'
import { openCnbNews } from '@/commands/open/open-cnb-news'
import { openCnbQ } from '@/commands/open/open-cnb-q'
import { openCnbIng } from '@/commands/open/open-cnb-ing'

function withPrefix(prefix: string) {
    return (rest: string) => `${prefix}${rest}`
}

export function setupExtCmd() {
    const ctx = globalCtx.extCtx
    const withAppName = withPrefix(globalCtx.extName)

    // TODO: simplify register
    const disposables = [
        regCmd(withAppName('.login'), login),
        regCmd(withAppName('.open-my-blog'), openMyBlog),
        regCmd(withAppName('.open-my-home-page'), openMyHomePage),
        regCmd(withAppName('.open-my-blog-console'), openMyWebBlogConsole),
        regCmd(withAppName('.open-my-account-settings'), openMyAccountSettings),
        regCmd(withAppName('.logout'), logout),
        regCmd(withAppName('.refresh-post-list'), refreshPostList),
        regCmd(withAppName('.previous-post-list'), gotoPreviousPostList),
        regCmd(withAppName('.seek-post-list'), seekPostList),
        regCmd(withAppName('.next-post-list'), gotoNextPostList),
        regCmd(withAppName('.edit-post'), openPostInVscode),
        regCmd(withAppName('.upload-post'), uploadPostToCnblogs),
        regCmd(withAppName('.modify-post-settings'), modifyPostSettings),
        regCmd(withAppName('.delete-post'), deleteSelectedPost),
        regCmd(withAppName('.create-local-draft'), createLocalDraft),
        regCmd(withAppName('.upload-post-file-to-cnblogs'), uploadPostFileToCnblogs),
        regCmd(withAppName('.pull-post-remote-updates'), pullPostRemoteUpdates),
        regCmd(withAppName('.upload-clipboard-image'), () => uploadImage(true, 'clipboard')),
        regCmd(withAppName('.upload-local-disk-image'), () => uploadImage(true, 'local')),
        regCmd(withAppName('.upload-image'), () => uploadImage(true)),
        regCmd(withAppName('.reveal-local-post-file-in-os'), revealLocalPostFileInOs),
        regCmd(withAppName('.show-post-to-local-file-info'), showLocalFileToPostInfo),
        regCmd(withAppName('.new-post-category'), newPostCategory),
        regCmd(withAppName('.delete-selected-post-categories'), handleDeletePostCategories),
        regCmd(withAppName('.refresh-post-categories-list'), refreshPostCategoriesList),
        regCmd(withAppName('.update-post-category'), handleUpdatePostCategory),
        regCmd(withAppName('.delete-post-to-local-file-map'), deletePostToLocalFileMap),
        regCmd(withAppName('.rename-post'), renamePost),
        regCmd(withAppName('.open-post-in-blog-admin'), openPostInBlogAdmin),
        regCmd(withAppName('.open-workspace'), openWorkspace),
        regCmd(withAppName('.set-workspace'), setWorkspace),
        regCmd(withAppName('.reveal-workspace-in-os'), revealWorkspaceInOs),
        regCmd(withAppName('.view-post-online'), viewPostOnline),
        regCmd(withAppName('.export-post-to-pdf'), (input: unknown) => exportPostToPdf(input)),
        regCmd(withAppName('.extract-images'), extractImages),
        regCmd(withAppName('.search-post'), searchPost),
        regCmd(withAppName('.clear-post-search-results'), clearPostSearchResults),
        regCmd(withAppName('.refresh-post-search-results'), refreshPostSearchResults),
        regCmd(withAppName('.copy-post-link'), input => new CopyPostLinkCmdHandler(input).handle()),
        regCmd(withAppName('.ing.publish'), () => new PublishIngCmdHandler('input').handle()),
        regCmd(withAppName('.ing.publish-selection'), () => new PublishIngCmdHandler('selection').handle()),
        regCmd(withAppName('.open-cnb-home'), openCnbHome),
        regCmd(withAppName('.open-cnb-news'), openCnbNews),
        regCmd(withAppName('.open-cnb-q'), openCnbQ),
        regCmd(withAppName('.open-cnb-ing'), openCnbIng),

        ...regIngListCmds(),
        ...regBlogExportCmds(),
    ]

    ctx.subscriptions.push(...disposables)
}
