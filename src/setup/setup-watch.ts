import { workspace } from 'vscode'
import { isTargetWorkspace } from '@/service/is-target-workspace'
import { PostFileMapManager } from '@/service/post-file-map'
import { refreshPostCategoryList } from '@/cmd/post-category/refresh-post-category-list'
import { refreshPostList } from '@/cmd/post-list/refresh-post-list'
import { execCmd } from '@/infra/cmd'
import { setupUi } from '@/setup/setup-ui'
import { LocalState } from '@/ctx/local-state'

export const setupCfgWatch = () =>
    workspace.onDidChangeConfiguration(ev => {
        if (ev.affectsConfiguration('cnblogsClient')) isTargetWorkspace()

        if (ev.affectsConfiguration('workbench.iconTheme')) refreshPostCategoryList()

        if (ev.affectsConfiguration('cnblogsClient.pageSize.postList'))
            refreshPostList({ queue: true }).catch(() => undefined)

        if (ev.affectsConfiguration('cnblogsClient.markdown'))
            execCmd('markdown.preview.refresh').then(undefined, () => undefined)

        if (ev.affectsConfiguration('cnblogsClient.ui')) setupUi(LocalState.getExtCfg())
    })

export const setupWorkspaceWatch = () =>
    workspace.onDidChangeWorkspaceFolders(() => {
        isTargetWorkspace()
    })

export const setupWorkspaceFileWatch = () =>
    workspace.onDidRenameFiles(e => {
        for (const item of e.files) {
            const { oldUri, newUri } = item
            const postId = PostFileMapManager.getPostId(oldUri.fsPath)
            if (postId !== undefined) void PostFileMapManager.updateOrCreate(postId, newUri.fsPath)
        }
    })
