import { globalCtx } from '@/ctx/global-ctx'
import { uploadPostFile, uploadPost } from '@/cmd/post-list/upload-post'
import { uploadImg } from '@/cmd/upload-img/upload-img'
import { osOpenLocalPostFile } from '@/cmd/open/os-open-local-post-file'
import { showLocalFileToPostInfo } from '@/cmd/show-local-file-to-post-info'
import { newPostCategory } from '@/cmd/post-category/new-post-category'
import { updatePostCatTreeView } from '@/cmd/post-category/update-post-category'
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
import { extractImg } from '@/cmd/extract-img/extract-img'
import { createPost } from '@/service/post/create'
import { delSelectedCat } from '@/cmd/post-category/del-selected-cat'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

function withPrefix(prefix: string) {
    return (rest: string) => `${prefix}${rest}`
}

export function setupExtCmd() {
    const ctx = globalCtx.extCtx
    const withAppName = withPrefix(globalCtx.extName)

    const tokens = [
        // auth
        regCmd(withAppName('.login.web'), AuthManager.webLogin),
        regCmd(withAppName('.login.pat'), AuthManager.patLogin),
        regCmd(withAppName('.logout'), AuthManager.logout),
        // post.list-view
        regCmd(withAppName('.post.list-view.refresh'), PostListView.refresh),
        regCmd(withAppName('.post.list-view.prev'), PostListView.goPrev),
        regCmd(withAppName('.post.list-view.next'), PostListView.goNext),
        regCmd(withAppName('.post.list-view.seek'), PostListView.seek),

        regCmd(withAppName('.post.list-view.search.clear'), PostListView.Search.clear),
        regCmd(withAppName('.post.list-view.search.refresh'), PostListView.Search.refresh),
        // post
        regCmd(withAppName('.post.del'), delSelectedPost),
        regCmd(withAppName('.post.edit'), openPostInVscode),
        regCmd(withAppName('.post.search'), PostListView.Search.search),
        regCmd(withAppName('.post.rename'), renamePost),
        regCmd(withAppName('.post.modify-setting'), modifyPostSetting),
        regCmd(withAppName('.post.create'), createPost),
        regCmd(withAppName('.post.upload'), uploadPost),
        regCmd(withAppName('.post.upload-file'), uploadPostFile),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        regCmd(withAppName('.post.upload-no-confirm'), arg => uploadPost(arg, false)),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        regCmd(withAppName('.post.upload-file-no-confirm'), arg => uploadPostFile(arg, false)),
        regCmd(withAppName('.post.pull'), postPull),
        regCmd(withAppName('.post.pull-all'), postPullAll),
        regCmd(withAppName('.post.open-in-blog-admin'), openPostInBlogAdmin),
        regCmd(withAppName('.post.del-local-map'), delPostToLocalFileMap),
        regCmd(withAppName('.post.view-in-browser'), viewPostOnline),
        regCmd(withAppName('.post.export-to-pdf'), exportPostToPdf),
        regCmd(withAppName('.post.copy-link'), copyPostLink),
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
        regCmd(withAppName('.post-category.del-select'), delSelectedCat),
        regCmd(withAppName('.post-category.refresh'), () => postCategoryDataProvider.refresh()),
        regCmd(withAppName('.post-category.update'), updatePostCatTreeView),
        // workspace
        regCmd(withAppName('.workspace.set'), Workspace.set),
        regCmd(withAppName('.workspace.os-open'), Workspace.osOpen),
        regCmd(withAppName('.workspace.code-open'), Workspace.codeOpen),
        // ing
        regCmd(withAppName('.ing.pub'), () => pubIngWithInput('')),
        regCmd(withAppName('.ing.pub-select'), pubIngWithSelect),
        // open in browser
        regCmd(withAppName('.open.cnb-q'), Browser.Open.Cnb.q),
        regCmd(withAppName('.open.cnb-ing'), Browser.Open.Cnb.ing),
        regCmd(withAppName('.open.cnb-home'), Browser.Open.Cnb.home),
        regCmd(withAppName('.open.cnb-news'), Browser.Open.Cnb.news),
        regCmd(withAppName('.open.my-blog'), Browser.Open.User.blog),
        regCmd(withAppName('.open.my-home'), Browser.Open.User.home),
        regCmd(withAppName('.open.blog-console'), Browser.Open.User.blogConsole),
        regCmd(withAppName('.open.account-setting'), Browser.Open.User.accountSetting),
        // ing list
        regCmd(withAppName('.ing-list.next'), Ing.ListView.goNext),
        regCmd(withAppName('.ing-list.prev'), Ing.ListView.goPrev),
        regCmd(withAppName('.ing-list.first'), Ing.ListView.goFirst),
        regCmd(withAppName('.ing-list.refresh'), Ing.ListView.refresh),
        regCmd(withAppName('.ing-list.switch-type'), Ing.ListView.switchType),
        regCmd(withAppName('.ing-list.open-in-browser'), Browser.Open.Cnb.ing),
        // blog export
        regCmd(withAppName('.backup.refresh-record'), refreshExportRecord),
        regCmd(withAppName('.backup.open-local'), openLocalExport),
        regCmd(withAppName('.backup.edit'), editExportPost),
        regCmd(withAppName('.backup.create'), createBlogExport),
        regCmd(withAppName('.backup.download'), downloadBlogExport),
        regCmd(withAppName('.backup.view-post'), viewPostBlogExport),
        regCmd(withAppName('.backup.delete'), deleteBlogExport),
    ]

    ctx.subscriptions.push(...tokens)
}
