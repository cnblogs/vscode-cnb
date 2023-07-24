import { openMyAccountSettings } from './open-my-account-settings'
import { openMyWebBlogConsole } from './open-my-blog-console'
import { openMyHomePage } from './open-my-home-page'
import { login, logout } from './login'
import { openMyBlog } from './open-my-blog'
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
import { openPostInBlogAdmin } from './open-post-in-blog-admin'
import { openWorkspace } from './open-workspace'
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

export function setupExtCmd() {
    const ctx = globalCtx.extCtx
    const appName = globalCtx.extName

    // TODO: simplify register
    const disposables = [
        regCmd(`${appName}.login`, login),
        regCmd(`${appName}.open-my-blog`, openMyBlog),
        regCmd(`${appName}.open-my-home-page`, openMyHomePage),
        regCmd(`${appName}.open-my-blog-console`, openMyWebBlogConsole),
        regCmd(`${appName}.open-my-account-settings`, openMyAccountSettings),
        regCmd(`${appName}.logout`, logout),
        regCmd(`${appName}.refresh-post-list`, refreshPostList),
        regCmd(`${appName}.previous-post-list`, gotoPreviousPostList),
        regCmd(`${appName}.seek-post-list`, seekPostList),
        regCmd(`${appName}.next-post-list`, gotoNextPostList),
        regCmd(`${appName}.edit-post`, openPostInVscode),
        regCmd(`${appName}.upload-post`, uploadPostToCnblogs),
        regCmd(`${appName}.modify-post-settings`, modifyPostSettings),
        regCmd(`${appName}.delete-post`, deleteSelectedPost),
        regCmd(`${appName}.create-local-draft`, createLocalDraft),
        regCmd(`${appName}.upload-post-file-to-cnblogs`, uploadPostFileToCnblogs),
        regCmd(`${appName}.pull-post-remote-updates`, pullPostRemoteUpdates),
        regCmd(`${appName}.upload-clipboard-image`, () => uploadImage(true, 'clipboard')),
        regCmd(`${appName}.upload-local-disk-image`, () => uploadImage(true, 'local')),
        regCmd(`${appName}.upload-image`, () => uploadImage(true)),
        regCmd(`${appName}.reveal-local-post-file-in-os`, revealLocalPostFileInOs),
        regCmd(`${appName}.show-post-to-local-file-info`, showLocalFileToPostInfo),
        regCmd(`${appName}.new-post-category`, newPostCategory),
        regCmd(`${appName}.delete-selected-post-categories`, handleDeletePostCategories),
        regCmd(`${appName}.refresh-post-categories-list`, refreshPostCategoriesList),
        regCmd(`${appName}.update-post-category`, handleUpdatePostCategory),
        regCmd(`${appName}.delete-post-to-local-file-map`, deletePostToLocalFileMap),
        regCmd(`${appName}.rename-post`, renamePost),
        regCmd(`${appName}.open-post-in-blog-admin`, openPostInBlogAdmin),
        regCmd(`${appName}.open-workspace`, openWorkspace),
        regCmd(`${appName}.set-workspace`, setWorkspace),
        regCmd(`${appName}.reveal-workspace-in-os`, revealWorkspaceInOs),
        regCmd(`${appName}.view-post-online`, viewPostOnline),
        regCmd(`${appName}.export-post-to-pdf`, (input: unknown) => exportPostToPdf(input)),
        regCmd(`${appName}.extract-images`, extractImages),
        regCmd(`${appName}.search-post`, searchPost),
        regCmd(`${appName}.clear-post-search-results`, clearPostSearchResults),
        regCmd(`${appName}.refresh-post-search-results`, refreshPostSearchResults),
        regCmd(`${appName}.copy-post-link`, input => new CopyPostLinkCmdHandler(input).handle()),
        regCmd(`${appName}.ing.publish`, () => new PublishIngCmdHandler('input').handle()),
        regCmd(`${appName}.ing.publish-selection`, () => new PublishIngCmdHandler('selection').handle()),

        ...regIngListCmds(),
        ...regBlogExportCmds(),
    ]

    ctx.subscriptions.push(...disposables)
}
