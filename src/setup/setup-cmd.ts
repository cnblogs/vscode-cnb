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
import { delSelectedPost } from '@/cmd/post-list/del-post'
import { modifyPostSetting } from '@/cmd/post-list/modify-post-setting'
import { uploadImg } from '@/cmd/upload-img/upload-img'
import { osOpenLocalPostFile } from '@/cmd/open/os-open-local-post-file'
import { showLocalFileToPostInfo } from '@/cmd/show-local-file-to-post-info'
import { newPostCategory } from '@/cmd/post-category/new-post-category'
import { refreshPostCategoryList } from '@/cmd/post-category/refresh-post-category-list'
import { handleUpdatePostCategory } from '@/cmd/post-category/update-post-category'
import { openPostInVscode } from '@/cmd/post-list/open-post-in-vscode'
import { delPostToLocalFileMap } from '@/cmd/post-list/del-post-to-local-file-map'
import { renamePost } from '@/cmd/post-list/rename-post'
import { openPostInBlogAdmin } from '@/cmd/open/open-post-in-blog-admin'
import { openWorkspace } from '@/cmd/open/open-workspace'
import { setWorkspace } from '@/cmd/set-workspace'
import { osOpenWorkspace } from '@/cmd/open/os-open-workspace'
import { viewPostOnline } from '@/cmd/view-post-online'
import { postPull } from '@/cmd/post-list/post-pull'
import { extractImg } from '@/cmd/extract-img'
import { clearPostSearchResults, refreshPostSearchResults, searchPost } from '@/cmd/post-list/search'
import { handleDeletePostCategories } from '@/cmd/post-category/del-selected-category'
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
import { AccountManagerNg } from '@/auth/account-manager'
import { uploadFsImage } from '@/cmd/upload-img/upload-fs-img'
import { uploadClipboardImg } from '@/cmd/upload-img/upload-clipboard-img'
import { insertImgLinkToActiveEditor } from '@/cmd/upload-img/upload-img-util'
import { postPullAll } from '@/cmd/post-list/post-pull-all'

function withPrefix(prefix: string) {
    return (rest: string) => `${prefix}${rest}`
}

export function setupExtCmd() {
    const ctx = globalCtx.extCtx
    const withAppName = withPrefix(globalCtx.extName)

    const tokens = [
        // auth
        regCmd(withAppName('.login.web'), AccountManagerNg.webLogin),
        regCmd(withAppName('.login.pat'), AccountManagerNg.patLogin),
        regCmd(withAppName('.logout'), AccountManagerNg.logout),
        // post-list
        regCmd(withAppName('.post-list.refresh'), refreshPostList),
        regCmd(withAppName('.post-list.prev'), goPrevPostList),
        regCmd(withAppName('.post-list.next'), goNextPostList),
        regCmd(withAppName('.post-list.seek'), seekPostList),
        regCmd(withAppName('.post-list.search.clear'), clearPostSearchResults),
        regCmd(withAppName('.post-list.search.refresh'), refreshPostSearchResults),
        // post
        regCmd(withAppName('.post.del'), delSelectedPost),
        regCmd(withAppName('.post.edit'), openPostInVscode),
        regCmd(withAppName('.post.search'), searchPost),
        regCmd(withAppName('.post.rename'), renamePost),
        regCmd(withAppName('.post.modify-setting'), modifyPostSetting),
        regCmd(withAppName('.post.create-local-draft'), createLocalDraft),
        regCmd(withAppName('.post.upload'), uploadPost),
        regCmd(withAppName('.post.upload-file'), uploadPostFile),
        regCmd(withAppName('.post.upload-no-confirm'), uploadPostNoConfirm),
        regCmd(withAppName('.post.upload-file-no-confirm'), uploadPostFileNoConfirm),
        regCmd(withAppName('.post.pull'), postPull),
        regCmd(withAppName('.post.pull-all'), postPullAll),
        regCmd(withAppName('.post.open-in-blog-admin'), openPostInBlogAdmin),
        regCmd(withAppName('.post.del-local-map'), delPostToLocalFileMap),
        regCmd(withAppName('.post.view-in-browser'), viewPostOnline),
        regCmd(withAppName('.post.export-to-pdf'), exportPostToPdf),
        regCmd(withAppName('.post.copy-link'), input => new CopyPostLinkCmdHandler(input).handle()),
        regCmd(withAppName('.post.os-open-local-file'), osOpenLocalPostFile),
        regCmd(withAppName('.post.show-local-file-info'), showLocalFileToPostInfo),
        // img
        regCmd(withAppName('.img.extract'), extractImg),
        regCmd(withAppName('.img.upload'), uploadImg),
        regCmd(withAppName('.img.upload-fs'), async () => {
            const link = await uploadFsImage()
            if (link !== undefined) await insertImgLinkToActiveEditor(link)
        }),
        regCmd(withAppName('.img.upload-clipboard'), async () => {
            const link = await uploadClipboardImg()
            if (link !== undefined) await insertImgLinkToActiveEditor(link)
        }),
        // post category
        regCmd(withAppName('.post-category.new'), newPostCategory),
        regCmd(withAppName('.post-category.del-select'), handleDeletePostCategories),
        regCmd(withAppName('.post-category.refresh'), refreshPostCategoryList),
        regCmd(withAppName('.post-category.update'), handleUpdatePostCategory),
        // workspace
        regCmd(withAppName('.workspace.open'), openWorkspace),
        regCmd(withAppName('.workspace.set'), setWorkspace),
        regCmd(withAppName('.workspace.os-open'), osOpenWorkspace),
        // ing
        regCmd(withAppName('.ing.pub'), () => new PublishIngCmdHandler('input').handle()),
        regCmd(withAppName('.ing.pub-select'), () => new PublishIngCmdHandler('select').handle()),
        // open in browser
        regCmd(withAppName('.open.cnb-home'), openCnbHome),
        regCmd(withAppName('.open.cnb-news'), openCnbNews),
        regCmd(withAppName('.open.cnb-q'), openCnbQ),
        regCmd(withAppName('.open.cnb-ing'), openCnbIng),
        regCmd(withAppName('.open.my-blog'), openMyBlog),
        regCmd(withAppName('.open.my-home'), openMyHomePage),
        regCmd(withAppName('.open.blog-console'), openMyWebBlogConsole),
        regCmd(withAppName('.open.account-setting'), openMyAccountSetting),
        // ing list
        regCmd(withAppName('.ing-list.refresh'), refreshIngList),
        regCmd(withAppName('.ing-list.next'), goIngListNextPage),
        regCmd(withAppName('.ing-list.prev'), goIngListPrevPage),
        regCmd(withAppName('.ing-list.first'), goIngList1stPage),
        regCmd(withAppName('.ing-list.switch-type'), switchIngType),
        regCmd(withAppName('.ing-list.open-in-browser'), openCnbIng),
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
