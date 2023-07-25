import { workspace } from 'vscode'
import { isTargetWorkspace } from '@/service/is-target-workspace'
import { PostFileMapManager } from '@/service/post-file-map'
import { ExtCfg } from '@/ctx/ext-cfg'
import { refreshPostCategoryList } from '@/cmd/post-category/refresh-post-category-list'
import { refreshPostList } from '@/cmd/post-list/refresh-post-list'
import { execCmd } from '@/infra/cmd'
import { setupUi } from '@/setup/setup-ui'

export const setupCfgWatch = () =>
    workspace.onDidChangeConfiguration(ev => {
        if (ev.affectsConfiguration(ExtCfg.cfgPrefix)) isTargetWorkspace()

        if (ev.affectsConfiguration(`${ExtCfg.iconThemePrefix}.${ExtCfg.iconThemeKey}`)) refreshPostCategoryList()

        if (ev.affectsConfiguration(`${ExtCfg.cfgPrefix}.${ExtCfg.postListPageSizeKey}`))
            refreshPostList({ queue: true }).catch(() => undefined)

        if (ev.affectsConfiguration(`${ExtCfg.cfgPrefix}.markdown`))
            execCmd('markdown.preview.refresh').then(undefined, () => undefined)

        if (ev.affectsConfiguration(`${ExtCfg.cfgPrefix}.ui`)) setupUi(ExtCfg.cfg)
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
