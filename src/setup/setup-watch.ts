import { workspace } from 'vscode'
import { isTargetWorkspace } from '@/service/is-target-workspace'
import { PostFileMapManager } from '@/service/post-file-map'
import { Settings } from '@/service/settings'
import { refreshPostCategoryList } from '@/cmd/post-category/refresh-post-category-list'
import { refreshPostList } from '@/cmd/post-list/refresh-post-list'
import { execCmd } from '@/infra/cmd'
import { setupUi } from '@/setup/setup-ui'

export const setupCfgWatch = () =>
    workspace.onDidChangeConfiguration(ev => {
        if (ev.affectsConfiguration(Settings.cfgPrefix)) isTargetWorkspace()

        if (ev.affectsConfiguration(`${Settings.iconThemePrefix}.${Settings.iconThemeKey}`)) refreshPostCategoryList()

        if (ev.affectsConfiguration(`${Settings.cfgPrefix}.${Settings.postListPageSizeKey}`))
            refreshPostList({ queue: true }).catch(() => undefined)

        if (ev.affectsConfiguration(`${Settings.cfgPrefix}.markdown`))
            execCmd('markdown.preview.refresh').then(undefined, () => undefined)

        if (ev.affectsConfiguration(`${Settings.cfgPrefix}.ui`)) setupUi(Settings.cfg)
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
