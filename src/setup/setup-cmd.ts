import { globalCtx } from '@/ctx/global-ctx'
import { uploadPostFile, uploadPost } from '@/cmd/post-list/upload-post'
import { uploadImg } from '@/cmd/upload-img/upload-img'
import { osOpenLocalPostFile } from '@/cmd/open/os-open-local-post-file'
import { showLocalFileToPostInfo } from '@/cmd/show-local-file-to-post-info'
import { newPostCat } from '@/cmd/post-cat/new-post-cat'
import { updatePostCatTreeView } from '@/cmd/post-cat/update-post-cat-treeview'
import { openPostInBlogAdmin } from '@/cmd/open/open-post-in-blog-admin'
import { viewPostOnline } from '@/cmd/view-post-online'
import { regCmd } from '@/infra/cmd'
import { exportPostToPdf } from '@/cmd/pdf/export-pdf'
import { editExportPost } from '@/cmd/blog-export/edit'
import { createBlogExport } from '@/cmd/blog-export/create'
import { downloadBlogExport } from '@/cmd/blog-export/download'
import { viewPostBlogExport } from '@/cmd/blog-export/view-post'
import { deleteBlogExport } from '@/cmd/blog-export/delete'
import { openLocalExport } from '@/cmd/blog-export/open-local'
import { refreshExportRecord } from '@/cmd/blog-export/refresh'
import { AuthManager } from '@/auth/auth-manager'
import { uploadFsImage } from '@/cmd/upload-img/upload-fs-img'
import { uploadClipboardImg } from '@/cmd/upload-img/upload-clipboard-img'
import { insertImgLinkToActiveEditor } from '@/cmd/upload-img/upload-img-util'
import { Workspace } from '@/cmd/workspace'
import { Browser } from '@/cmd/browser'
import { Ing } from '@/cmd/ing/ing-page-list'
import { PostListView } from '@/cmd/post-list/post-list-view'
import { postPull } from '@/cmd/post-list/post-pull'
import { postPullAll } from '@/cmd/post-list/post-pull-all'
import { delPostToLocalFileMap } from '@/cmd/post-list/del-post-to-local-file-map'
import { copyPostLink } from '@/cmd/post-list/copy-link'
import { modifyPostSetting } from '@/cmd/post-list/modify-post-setting'
import { renamePost } from '@/cmd/post-list/rename-post'
import { openPostInVscode } from '@/cmd/post-list/open-post-in-vscode'
import { delSelectedPost } from '@/cmd/post-list/del-post'
import { pubIngWithInput } from '@/cmd/ing/pub-ing-with-input'
import { pubIngWithSelect } from '@/cmd/ing/pub-ing-with-select'
import { extractImgCmd } from '@/cmd/extract-img'
import { createPost } from '@/service/post/create'
import { delSelectedCat } from '@/cmd/post-cat/del-selected-cat'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { extName } from '@/ctx/ext-const'

export function setupCmd() {
    const ctx = globalCtx.extCtx

    const tokens = [
        // auth
        regCmd(extName`.login.web`, AuthManager.webLogin),
        regCmd(extName`.login.pat`, AuthManager.patLogin),
        regCmd(extName`.logout`, AuthManager.logout),
        // post.list-view
        regCmd(extName`.post.list-view.refresh`, PostListView.refresh),
        regCmd(extName`.post.list-view.prev`, PostListView.goPrev),
        regCmd(extName`.post.list-view.next`, PostListView.goNext),
        regCmd(extName`.post.list-view.seek`, PostListView.seek),

        regCmd(extName`.post.list-view.search.clear`, PostListView.Search.clear),
        regCmd(extName`.post.list-view.search.refresh`, PostListView.Search.refresh),
        // post
        regCmd(extName`.post.del`, delSelectedPost),
        regCmd(extName`.post.edit`, openPostInVscode),
        regCmd(extName`.post.search`, PostListView.Search.search),
        regCmd(extName`.post.rename`, renamePost),
        regCmd(extName`.post.modify-setting`, modifyPostSetting),
        regCmd(extName`.post.create`, createPost),
        regCmd(extName`.post.upload`, uploadPost),
        regCmd(extName`.post.upload-file`, uploadPostFile),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        regCmd(extName`.post.upload-no-confirm`, arg => uploadPost(arg, false)),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        regCmd(extName`.post.upload-file-no-confirm`, arg => uploadPostFile(arg, false)),
        regCmd(extName`.post.pull`, postPull),
        regCmd(extName`.post.pull-all`, postPullAll),
        regCmd(extName`.post.open-in-blog-admin`, openPostInBlogAdmin),
        regCmd(extName`.post.del-local-map`, delPostToLocalFileMap),
        regCmd(extName`.post.view-in-browser`, viewPostOnline),
        regCmd(extName`.post.export-to-pdf`, exportPostToPdf),
        regCmd(extName`.post.copy-link`, copyPostLink),
        regCmd(extName`.post.os-open-local-file`, osOpenLocalPostFile),
        regCmd(extName`.post.show-local-file-info`, showLocalFileToPostInfo),
        // img
        regCmd(extName`.img.extract`, extractImgCmd),
        regCmd(extName`.img.upload`, uploadImg),
        regCmd(extName`.img.upload-fs`, async () => {
            const link = await uploadFsImage()
            if (link !== undefined) await insertImgLinkToActiveEditor(link)
        }),
        regCmd(extName`.img.upload-clipboard`, async () => {
            const link = await uploadClipboardImg()
            if (link !== undefined) await insertImgLinkToActiveEditor(link)
        }),
        // post category
        regCmd(extName`.post-category.new`, newPostCat),
        regCmd(extName`.post-category.del-select`, delSelectedCat),
        regCmd(extName`.post-category.refresh`, () => postCategoryDataProvider.refresh()),
        regCmd(extName`.post-category.update`, updatePostCatTreeView),
        // workspace
        regCmd(extName`.workspace.set`, Workspace.set),
        regCmd(extName`.workspace.os-open`, Workspace.osOpen),
        regCmd(extName`.workspace.code-open`, Workspace.codeOpen),
        // ing
        regCmd(extName`.ing.pub`, () => pubIngWithInput('')),
        regCmd(extName`.ing.pub-select`, pubIngWithSelect),
        // open in browser
        regCmd(extName`.open.cnb-q`, Browser.Open.Cnb.q),
        regCmd(extName`.open.cnb-ing`, Browser.Open.Cnb.ing),
        regCmd(extName`.open.cnb-home`, Browser.Open.Cnb.home),
        regCmd(extName`.open.cnb-news`, Browser.Open.Cnb.news),
        regCmd(extName`.open.my-blog`, Browser.Open.User.blog),
        regCmd(extName`.open.my-home`, Browser.Open.User.home),
        regCmd(extName`.open.blog-console`, Browser.Open.User.blogConsole),
        regCmd(extName`.open.account-setting`, Browser.Open.User.accountSetting),
        // ing list
        regCmd(extName`.ing-list.next`, Ing.ListView.goNext),
        regCmd(extName`.ing-list.prev`, Ing.ListView.goPrev),
        regCmd(extName`.ing-list.first`, Ing.ListView.goFirst),
        regCmd(extName`.ing-list.refresh`, Ing.ListView.refresh),
        regCmd(extName`.ing-list.switch-type`, Ing.ListView.switchType),
        regCmd(extName`.ing-list.open-in-browser`, Browser.Open.Cnb.ing),
        // blog export
        regCmd(extName`.backup.refresh-record`, refreshExportRecord),
        regCmd(extName`.backup.open-local`, openLocalExport),
        regCmd(extName`.backup.edit`, editExportPost),
        regCmd(extName`.backup.create`, createBlogExport),
        regCmd(extName`.backup.download`, downloadBlogExport),
        regCmd(extName`.backup.view-post`, viewPostBlogExport),
        regCmd(extName`.backup.delete`, deleteBlogExport),
    ]

    ctx.subscriptions.push(...tokens)
}
