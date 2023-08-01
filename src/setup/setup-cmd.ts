import { openIngSite } from '@/cmd/open/open-ing-site'
import { switchIngType } from '@/cmd/ing/select-ing-type'
import { refreshIngList } from '@/cmd/ing/refresh-ing-list'
import { goIngList1stPage, goIngListNextPage, goIngListPrevPage } from '@/cmd/ing/switch-ing-list-page'
import { openMyAccountSetting } from '@/cmd/open/open-my-account-setting'
import { openMyWebBlogConsole } from '@/cmd/open/open-my-blog-console'
import { openMyHomePage } from '@/cmd/open/open-my-home-page'
import { openMyBlog } from '@/cmd/open/open-my-blog'
import { globalCtx } from '@/ctx/global-ctx'
import { goNextPostList, goPrevPostList, refreshPostList, seekPostList } from '@/cmd/post-list/refresh-post-list'
import { uploadPostFile, uploadPost, uploadPostNoConfirm, uploadPostFileNoConfirm } from '@/cmd/post-list/upload-post'
import { createLocalDraft } from '@/cmd/post-list/create-local-draft'
import { deleteSelectedPost } from '@/cmd/post-list/delete-post'
import { modifyPostSetting } from '@/cmd/post-list/modify-post-setting'
import { uploadImg } from '@/cmd/upload-img/upload-img'
import { osOpenLocalPostFile } from '@/cmd/open/os-open-local-post-file'
import { showLocalFileToPostInfo } from '@/cmd/show-local-file-to-post-info'
import { newPostCategory } from '@/cmd/post-category/new-post-category'
import { refreshPostCategoryList } from '@/cmd/post-category/refresh-post-category-list'
import { handleUpdatePostCategory } from '@/cmd/post-category/update-post-category'
import { openPostInVscode } from '@/cmd/post-list/open-post-in-vscode'
import { deletePostToLocalFileMap } from '@/cmd/post-list/delete-post-to-local-file-map'
import { renamePost } from '@/cmd/post-list/rename-post'
import { openPostInBlogAdmin } from '@/cmd/open/open-post-in-blog-admin'
import { openWorkspace } from '@/cmd/open/open-workspace'
import { setWorkspace } from '@/cmd/set-workspace'
import { osOpenWorkspace } from '@/cmd/open/os-open-workspace'
import { viewPostOnline } from '@/cmd/view-post-online'
import { pullRemotePost } from '@/cmd/pull-remote-post'
import { extractImg } from '@/cmd/extract-img'
import { clearPostSearchResults, refreshPostSearchResults, searchPost } from '@/cmd/post-list/search'
import { handleDeletePostCategories } from '@/cmd/post-category/delete-selected-category'
import { PublishIngCmdHandler } from '@/cmd/ing/publish-ing'
import { CopyPostLinkCmdHandler } from '@/cmd/post-list/copy-link'
import { regCmd } from '@/infra/cmd'
import { exportPostToPdf } from '@/cmd/pdf/export-pdf'
import { openCnbHome } from '@/cmd/open/open-cnb-home'
import { openCnbNews } from '@/cmd/open/open-cnb-news'
import { openCnbQ } from '@/cmd/open/open-cnb-q'
import { openCnbIng } from '@/cmd/open/open-cnb-ing'
import { editExportPost } from '@/cmd/blog-export/edit'
import { createBlogExport } from '@/cmd/blog-export/create'
import { downloadBlogExport } from '@/cmd/blog-export/download'
import { viewPostBlogExport } from '@/cmd/blog-export/view-post'
import { deleteBlogExport } from '@/cmd/blog-export/delete'
import { openLocalExport } from '@/cmd/blog-export/open-local'
import { refreshExportRecord } from '@/cmd/blog-export/refresh'
import { accountManager } from '@/auth/account-manager'

function withPrefix(prefix: string) {
    return (rest: string) => `${prefix}${rest}`
}

export function setupExtCmd() {
    const ctx = globalCtx.extCtx
    const withAppName = withPrefix(globalCtx.extName)

    const tokens = [
        // auth
        regCmd(withAppName('.login'), () => accountManager.login()),
        regCmd(withAppName('.logout'), () => accountManager.logout()),
        // post-list
        regCmd(withAppName('.refresh-post-list'), refreshPostList),
        regCmd(withAppName('.prev-post-list'), goPrevPostList),
        regCmd(withAppName('.next-post-list'), goNextPostList),
        regCmd(withAppName('.seek-post-list'), seekPostList),
        // post
        regCmd(withAppName('.delete-post'), deleteSelectedPost),
        regCmd(withAppName('.edit-post'), openPostInVscode),
        regCmd(withAppName('.search-post'), searchPost),
        regCmd(withAppName('.rename-post'), renamePost),
        regCmd(withAppName('.modify-post-setting'), modifyPostSetting),
        regCmd(withAppName('.create-local-draft'), createLocalDraft),
        regCmd(withAppName('.upload-post'), uploadPost),
        regCmd(withAppName('.upload-post-file'), uploadPostFile),
        regCmd(withAppName('.upload-post-no-confirm'), uploadPostNoConfirm),
        regCmd(withAppName('.upload-post-file-no-confirm'), uploadPostFileNoConfirm),
        regCmd(withAppName('.pull-remote-post'), pullRemotePost),
        regCmd(withAppName('.open-post-in-blog-admin'), openPostInBlogAdmin),
        regCmd(withAppName('.delete-post-to-local-file-map'), deletePostToLocalFileMap),
        regCmd(withAppName('.view-post-online'), viewPostOnline),
        regCmd(withAppName('.export-post-to-pdf'), exportPostToPdf),
        regCmd(withAppName('.clear-post-search-results'), clearPostSearchResults),
        regCmd(withAppName('.refresh-post-search-results'), refreshPostSearchResults),
        regCmd(withAppName('.copy-post-link'), input => new CopyPostLinkCmdHandler(input).handle()),
        regCmd(withAppName('.reveal-local-post-file-in-os'), osOpenLocalPostFile),
        regCmd(withAppName('.show-post-to-local-file-info'), showLocalFileToPostInfo),
        // img
        regCmd(withAppName('.extract-img'), extractImg),
        regCmd(withAppName('.upload-img'), () => uploadImg(true)),
        regCmd(withAppName('.upload-fs-img'), () => uploadImg(true, 'local')),
        regCmd(withAppName('.upload-clipboard-image'), () => uploadImg(true, 'clipboard')),
        // post category
        regCmd(withAppName('.new-post-category'), newPostCategory),
        regCmd(withAppName('.delete-selected-post-category'), handleDeletePostCategories),
        regCmd(withAppName('.refresh-post-category-list'), refreshPostCategoryList),
        regCmd(withAppName('.update-post-category'), handleUpdatePostCategory),
        // workspace
        regCmd(withAppName('.open-workspace'), openWorkspace),
        regCmd(withAppName('.set-workspace'), setWorkspace),
        regCmd(withAppName('.reveal-workspace-in-os'), osOpenWorkspace),
        // ing
        regCmd(withAppName('.ing.publish'), () => new PublishIngCmdHandler('input').handle()),
        regCmd(withAppName('.ing.publish-select'), () => new PublishIngCmdHandler('select').handle()),
        // open in browser
        regCmd(withAppName('.open-cnb-home'), openCnbHome),
        regCmd(withAppName('.open-cnb-news'), openCnbNews),
        regCmd(withAppName('.open-cnb-q'), openCnbQ),
        regCmd(withAppName('.open-cnb-ing'), openCnbIng),
        regCmd(withAppName('.open-my-blog'), openMyBlog),
        regCmd(withAppName('.open-my-home-page'), openMyHomePage),
        regCmd(withAppName('.open-my-blog-console'), openMyWebBlogConsole),
        regCmd(withAppName('.open-my-account-setting'), openMyAccountSetting),
        // ing list
        regCmd(withAppName('.ing-list.refresh'), refreshIngList),
        regCmd(withAppName('.ing-list.next'), goIngListNextPage),
        regCmd(withAppName('.ing-list.previous'), goIngListPrevPage),
        regCmd(withAppName('.ing-list.first'), goIngList1stPage),
        regCmd(withAppName('.ing-list.switch-type'), switchIngType),
        regCmd(withAppName('.ing-list.open-in-browser'), openIngSite),
        // blog export
        regCmd(withAppName('.blog-export.refresh-record'), refreshExportRecord),
        regCmd(withAppName('.blog-export.open-local-export'), openLocalExport),
        regCmd(withAppName('.blog-export.edit'), editExportPost),
        regCmd(withAppName('.blog-export.create'), createBlogExport),
        regCmd(withAppName('.blog-export.download'), downloadBlogExport),
        regCmd(withAppName('.blog-export.view-post'), viewPostBlogExport),
        regCmd(withAppName('.blog-export.delete'), deleteBlogExport),
    ]

    ctx.subscriptions.push(...tokens)
}
