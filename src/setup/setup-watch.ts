import { workspace } from 'vscode'
import { isTargetWorkspace } from '@/service/is-target-workspace'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { execCmd } from '@/infra/cmd'
import { setupUi } from '@/setup/setup-ui'
import { LocalState } from '@/ctx/local-state'
import { PostListView } from '@/cmd/post-list/post-list-view'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

export const setupCfgWatch = () =>
    workspace.onDidChangeConfiguration(ev => {
        if (ev.affectsConfiguration('cnblogsClient')) isTargetWorkspace()

        if (ev.affectsConfiguration('workbench.iconTheme')) postCategoryDataProvider.refresh()

        if (ev.affectsConfiguration('cnblogsClient.pageSize.postList')) void PostListView.refresh({ queue: true })

        if (ev.affectsConfiguration('cnblogsClient.markdown')) void execCmd('markdown.preview.refresh')

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
            const postId = PostFileMapManager.getPostId(oldUri.path)
            if (postId !== undefined) void PostFileMapManager.updateOrCreate(postId, newUri.path)
        }
    })
